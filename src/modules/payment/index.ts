import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { v7 as uuidv7 } from "uuid";
import { successResponse, errorResponse } from "../../share/transport/http-server";
import { protect } from "../../share/middleware/auth";
import { logger } from "../system/log/logger";
import { ENV } from "../../share/common/value";

// ─── Mock Payment Gateway ─────────────────────────────────────────────────────
// For MVP: generates a mock payment URL and processes webhook locally.
// Replace gateway methods with real VNPAY/MoMo SDKs when ready.

const PAYMENT_METHODS = ["VNPAY", "MOMO", "ZALOPAY", "CARD"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const CreatePaymentSchema = z.object({
  orderId: z.string().min(1),
  paymentMethod: z.enum(PAYMENT_METHODS),
});

const COMMISSION_RATE = 0.1;

function mockPaymentUrl(orderId: string, method: PaymentMethod, gatewayRef: string): string {
  const baseUrl = process.env.FE_URL || "http://localhost:3001";
  // In real life this would redirect to VNPAY/MoMo. For MVP, redirect to result page with success.
  return `${baseUrl}/booking/result?orderId=${orderId}&gatewayRef=${gatewayRef}&method=${method}&mock=1`;
}

export function setupPaymentRoutes(prisma: PrismaClient): Router {
  const router = Router();

  // ── POST /payment/create (auth required) ───────────────────────────────────
  router.post("/payment/create", ...protect(), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return errorResponse(res, 401, "Unauthorized");

      const parsed = CreatePaymentSchema.safeParse(req.body);
      if (!parsed.success) {
        return errorResponse(res, 400, "Dữ liệu không hợp lệ", "VALIDATION_ERROR", parsed.error.flatten());
      }

      const { orderId, paymentMethod } = parsed.data;

      // Validate order
      const order = await (prisma.order as any).findUnique({
        where: { id: orderId },
        include: {
          tickets: { select: { id: true, seatId: true } },
        },
      });

      if (!order) return errorResponse(res, 404, "Đơn hàng không tồn tại");
      if (order.userId !== userId) return errorResponse(res, 403, "Forbidden");
      if (!["PENDING", "PAYMENT_PROCESSING"].includes(order.status)) {
        return errorResponse(res, 409, `Đơn hàng không hợp lệ (trạng thái: ${order.status})`);
      }
      if (new Date() > new Date(order.expiresAt)) {
        return errorResponse(res, 409, "Đơn hàng đã hết hạn. Vui lòng chọn lại ghế.");
      }

      // Idempotency: check existing pending transaction
      const existingTx = await prisma.transaction.findFirst({
        where: { orderId, status: "PENDING", userId } as any,
        orderBy: { createdAt: "desc" },
      });

      if (existingTx && (existingTx as any).paymentGatewayRef) {
        const paymentUrl = mockPaymentUrl(orderId, paymentMethod, (existingTx as any).paymentGatewayRef);
        return successResponse(res, { paymentUrl, transactionId: existingTx.id }, "URL thanh toán (existing)");
      }

      // Create transaction
      const gatewayRef = `${paymentMethod}-${uuidv7()}`;
      const idempotencyKey = `${userId}:${orderId}`;

      const transaction = await prisma.transaction.create({
        data: {
          userId,
          orderId,
          type: "TICKET_SALE",
          status: "PENDING",
          amount: order.finalAmount,
          paymentMethod,
          paymentGatewayRef: gatewayRef,
          description: `Thanh toán vé - Đơn hàng ${orderId}`,
        } as any,
      });

      // Update order to PAYMENT_PROCESSING
      await (prisma.order as any).update({
        where: { id: orderId },
        data: { status: "PAYMENT_PROCESSING", idempotencyKey },
      });

      const paymentUrl = mockPaymentUrl(orderId, paymentMethod, gatewayRef);

      logger.info("[Payment] Created", { transactionId: transaction.id, orderId, method: paymentMethod });
      successResponse(res, { paymentUrl, transactionId: transaction.id }, "URL thanh toán đã được tạo");
    } catch (err: any) {
      logger.error("[Payment] create error", { error: err.message });
      errorResponse(res, 500, err.message);
    }
  });

  // ── GET /payment/status/:orderId (auth required) ───────────────────────────
  router.get("/payment/status/:orderId", ...protect(), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { orderId } = req.params;

      const order = await (prisma.order as any).findUnique({
        where: { id: orderId },
        include: {
          tickets: {
            select: {
              id: true,
              seatNumber: true,
              status: true,
              qrCode: true,
              purchasePrice: true,
            },
          },
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, status: true, paymentMethod: true, paymentGatewayRef: true },
          },
        },
      });

      if (!order) return errorResponse(res, 404, "Đơn hàng không tồn tại");
      if (order.userId !== userId) return errorResponse(res, 403, "Forbidden");

      successResponse(res, order, "Trạng thái thanh toán");
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // ── POST /payment/webhook/mock (public — called by mock gateway redirect) ──
  // In production this would be called by VNPAY/MoMo server
  router.post("/payment/webhook/mock", async (req: Request, res: Response) => {
    try {
      const { gatewayRef, status: paymentStatus } = req.body;

      if (!gatewayRef) return errorResponse(res, 400, "gatewayRef is required");

      const transaction = await prisma.transaction.findFirst({
        where: { paymentGatewayRef: gatewayRef } as any,
      });

      if (!transaction) return errorResponse(res, 404, "Transaction not found");
      if (transaction.status === "COMPLETED") {
        return successResponse(res, { idempotent: true }, "Already processed");
      }

      const orderId = (transaction as any).orderId;
      if (!orderId) return errorResponse(res, 400, "No orderId on transaction");

      const order = await (prisma.order as any).findUnique({
        where: { id: orderId },
        include: { tickets: { select: { id: true, seatId: true, partnerAmount: true } } },
      });

      if (!order) return errorResponse(res, 404, "Order not found");

      const isSuccess = paymentStatus !== "FAILED";

      if (isSuccess) {
        await prisma.$transaction(async (tx) => {
          // Transaction → COMPLETED
          await tx.transaction.update({
            where: { id: transaction.id },
            data: { status: "COMPLETED" },
          });

          // Order → COMPLETED
          await (tx.order as any).update({
            where: { id: orderId },
            data: { status: "COMPLETED" },
          });

          // Tickets → CONFIRMED + generate real QR codes
          for (const ticket of order.tickets) {
            const qrCode = `CINEPASS-${ticket.id}`;
            await (tx.ticket as any).update({
              where: { id: ticket.id },
              data: { status: "CONFIRMED", qrCode },
            });

            // Update seat → BOOKED
            await tx.seat.update({
              where: { id: ticket.seatId },
              data: { status: "BOOKED", lockedUntil: null, lockedBy: null },
            });
          }

          // Credit partner wallet
          const totalPartnerAmount = order.tickets.reduce(
            (sum: number, t: any) => sum + t.partnerAmount,
            0,
          );
          if (totalPartnerAmount > 0 && order.tickets.length > 0) {
            const partnerId = await getPartnerIdFromShowtime(prisma, order.showtimeId);
            if (partnerId) {
              await (tx.partnerWallet as any).upsert({
                where: { partnerId },
                update: {
                  balance: { increment: totalPartnerAmount },
                  totalEarned: { increment: totalPartnerAmount },
                },
                create: {
                  partnerId,
                  balance: totalPartnerAmount,
                  totalEarned: totalPartnerAmount,
                },
              });
            }
          }

          // Decrement available seats
          await tx.showtime.update({
            where: { id: order.showtimeId },
            data: {
              bookedSeats: { increment: order.tickets.length },
              availableSeats: { decrement: order.tickets.length },
            },
          });
        });

        logger.info("[Payment] Webhook SUCCESS", { orderId, transactionId: transaction.id });
      } else {
        // FAILED: release seats, cancel tickets, cancel order
        await prisma.$transaction(async (tx) => {
          await tx.transaction.update({ where: { id: transaction.id }, data: { status: "FAILED" } });
          await (tx.order as any).update({ where: { id: orderId }, data: { status: "CANCELLED" } });

          for (const ticket of order.tickets) {
            await (tx.ticket as any).update({
              where: { id: ticket.id },
              data: { status: "CANCELLED", cancelledAt: new Date() },
            });
            await tx.seat.update({
              where: { id: ticket.seatId },
              data: { status: "AVAILABLE", lockedUntil: null, lockedBy: null },
            });
          }
        });

        logger.info("[Payment] Webhook FAILED", { orderId });
      }

      res.status(200).json({ success: true });
    } catch (err: any) {
      logger.error("[Payment] webhook error", { error: err.message });
      errorResponse(res, 500, err.message);
    }
  });

  // ── POST /payment/confirm-mock (client calls after mock redirect) ──────────
  // The FE calls this after landing on /booking/result with mock=1
  // to trigger the webhook logic without needing a real webhook server
  router.post("/payment/confirm-mock", ...protect(), async (req: Request, res: Response) => {
    try {
      const { orderId, gatewayRef, status: paymentStatus } = req.body;
      if (!gatewayRef || !orderId) return errorResponse(res, 400, "orderId and gatewayRef required");

      // Reuse webhook logic
      req.body = { gatewayRef, status: paymentStatus || "SUCCESS" };

      // Inline the webhook processing for mock mode
      const transaction = await prisma.transaction.findFirst({
        where: { paymentGatewayRef: gatewayRef } as any,
      });
      if (!transaction || transaction.status === "COMPLETED") {
        return successResponse(res, { idempotent: true }, "Already processed");
      }

      const orderRecord = await (prisma.order as any).findUnique({
        where: { id: orderId },
        include: { tickets: { select: { id: true, seatId: true, partnerAmount: true } } },
      });

      if (!orderRecord) return errorResponse(res, 404, "Order not found");
      const userId = (req as any).user?.id;
      if (orderRecord.userId !== userId) return errorResponse(res, 403, "Forbidden");

      await prisma.$transaction(async (tx) => {
        await tx.transaction.update({ where: { id: transaction.id }, data: { status: "COMPLETED" } });
        await (tx.order as any).update({ where: { id: orderId }, data: { status: "COMPLETED" } });

        for (const ticket of orderRecord.tickets) {
          await (tx.ticket as any).update({
            where: { id: ticket.id },
            data: { status: "CONFIRMED", qrCode: `CINEPASS-${ticket.id}` },
          });
          await tx.seat.update({
            where: { id: ticket.seatId },
            data: { status: "BOOKED", lockedUntil: null, lockedBy: null },
          });
        }

        await tx.showtime.update({
          where: { id: orderRecord.showtimeId },
          data: {
            bookedSeats: { increment: orderRecord.tickets.length },
            availableSeats: { decrement: orderRecord.tickets.length },
          },
        });
      });

      logger.info("[Payment] Mock confirmed", { orderId });
      successResponse(res, { orderId, status: "COMPLETED" }, "Thanh toán thành công");
    } catch (err: any) {
      logger.error("[Payment] confirm-mock error", { error: err.message });
      errorResponse(res, 500, err.message);
    }
  });

  return router;
}

async function getPartnerIdFromShowtime(prisma: PrismaClient, showtimeId: string): Promise<string | null> {
  const st = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    select: { partnerId: true },
  });
  return st?.partnerId ?? null;
}
