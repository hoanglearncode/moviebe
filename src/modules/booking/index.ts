import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { v7 as uuidv7 } from "uuid";
import { successResponse, errorResponse } from "../../share/transport/http-server";
import { protect } from "../../share/middleware/auth";
import { logger } from "../system/log/logger";

const LOCK_MINUTES = 10;
const COMMISSION_RATE = 0.1; // 10% platform fee

const LockSeatsSchema = z.object({
  showtimeId: z.string().min(1, "showtimeId là bắt buộc"),
  seatIds: z.array(z.string()).min(1, "Chọn ít nhất 1 ghế").max(8, "Tối đa 8 ghế mỗi lần đặt"),
});

export function setupBookingRoutes(prisma: PrismaClient): Router {
  const router = Router();

  // All booking routes require auth
  router.use(...protect());

  // ── POST /booking/lock-seats ───────────────────────────────────────────────
  router.post("/booking/lock-seats", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return errorResponse(res, 401, "Unauthorized");

      const parsed = LockSeatsSchema.safeParse(req.body);
      if (!parsed.success) {
        return errorResponse(
          res,
          400,
          "Dữ liệu không hợp lệ",
          "VALIDATION_ERROR",
          parsed.error.flatten(),
        );
      }

      const { showtimeId, seatIds } = parsed.data;

      // 1. Validate showtime
      const showtime = await prisma.showtime.findUnique({
        where: { id: showtimeId },
        include: { movie: { select: { id: true, title: true, partnerId: true } } },
      });
      if (!showtime) return errorResponse(res, 404, "Suất chiếu không tồn tại");
      if (showtime.status !== "SCHEDULED") {
        return errorResponse(res, 409, "Suất chiếu không còn khả dụng");
      }
      if (new Date() >= showtime.startTime) {
        return errorResponse(res, 409, "Suất chiếu đã bắt đầu");
      }

      // 2. Check user doesn't already have a PENDING order for this showtime (anti multi-tab)
      const existingOrder = await (prisma.order as any).findFirst({
        where: {
          userId,
          showtimeId,
          status: { in: ["PENDING", "PAYMENT_PROCESSING"] },
          expiresAt: { gt: new Date() },
        },
      });
      if (existingOrder) {
        return errorResponse(
          res,
          409,
          "Bạn đã có đơn hàng đang xử lý cho suất chiếu này",
          "ORDER_EXISTS",
          {
            orderId: existingOrder.id,
          },
        );
      }

      // 3. Fetch and validate seats
      const seats = await prisma.seat.findMany({
        where: { id: { in: seatIds }, showtimeId },
      });

      if (seats.length !== seatIds.length) {
        return errorResponse(res, 400, "Một số ghế không hợp lệ hoặc không thuộc suất chiếu này");
      }

      const now = new Date();
      const unavailable = seats.filter(
        (s) =>
          s.status === "BOOKED" || (s.status === "LOCKED" && s.lockedUntil && s.lockedUntil > now),
      );
      if (unavailable.length > 0) {
        return errorResponse(
          res,
          409,
          "Một số ghế đã được đặt hoặc đang bị giữ",
          "SEATS_UNAVAILABLE",
          {
            unavailableSeats: unavailable.map((s) => s.seatNumber),
          },
        );
      }

      // 4. Lock seats + create order atomically
      const expiresAt = new Date(now.getTime() + LOCK_MINUTES * 60 * 1000);
      const lockedUntil = expiresAt;

      const totalAmount = seats.reduce((sum, s) => sum + s.price, 0);
      const platformFee = Math.round(totalAmount * COMMISSION_RATE);

      const result = await prisma.$transaction(async (tx) => {
        // Lock all seats
        await tx.seat.updateMany({
          where: { id: { in: seatIds } },
          data: { status: "LOCKED", lockedUntil, lockedBy: userId },
        });

        // Create order
        const order = await (tx.order as any).create({
          data: {
            userId,
            showtimeId,
            status: "PENDING",
            totalAmount,
            discountAmount: 0,
            finalAmount: totalAmount,
            expiresAt,
          },
        });

        // Create RESERVED tickets (one per seat)
        const ticketData = seats.map((seat) => ({
          id: uuidv7(),
          userId,
          orderId: order.id,
          showtimeId,
          partnerId: showtime.partnerId,
          movieId: showtime.movieId,
          seatId: seat.id,
          seatNumber: seat.seatNumber,
          purchasePrice: seat.price,
          partnerAmount: seat.price - Math.round(seat.price * COMMISSION_RATE),
          platformFee: Math.round(seat.price * COMMISSION_RATE),
          status: "RESERVED",
          qrCode: `QR-${uuidv7()}`,
          purchasedAt: now,
        }));

        for (const t of ticketData) {
          await (tx.ticket as any).create({ data: t });
        }

        return {
          order,
          seats: seats.map((s) => ({ id: s.id, seatNumber: s.seatNumber, price: s.price })),
        };
      });

      logger.info("[Booking] Seats locked", {
        orderId: result.order.id,
        userId,
        seatCount: seatIds.length,
      });
      successResponse(
        res,
        { orderId: result.order.id, expiresAt, seats: result.seats, totalAmount },
        "Ghế đã được giữ trong 10 phút",
        201,
      );
    } catch (err: any) {
      logger.error("[Booking] lock-seats error", { error: err.message });
      errorResponse(res, 500, err.message);
    }
  });

  // ── GET /booking/:orderId ──────────────────────────────────────────────────
  router.get("/booking/:orderId", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { orderId } = req.params;

      const order = await (prisma.order as any).findUnique({
        where: { id: orderId },
        include: {
          tickets: {
            include: {
              seat: { select: { seatNumber: true, rowLabel: true, seatType: true } },
            },
          },
          showtime: {
            include: {
              movie: { select: { id: true, title: true, posterUrl: true, duration: true } },
              partner: { select: { cinemaName: true, city: true, address: true } },
            },
          },
        },
      });

      if (!order) return errorResponse(res, 404, "Đơn hàng không tồn tại");
      if (order.userId !== userId)
        return errorResponse(res, 403, "Bạn không có quyền xem đơn hàng này");

      // Mark expired orders
      if (order.status === "PENDING" && new Date() > new Date(order.expiresAt)) {
        await (prisma.order as any).update({ where: { id: orderId }, data: { status: "EXPIRED" } });
        order.status = "EXPIRED";
      }

      successResponse(res, order, "Chi tiết đơn hàng");
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // ── DELETE /booking/:orderId ───────────────────────────────────────────────
  router.delete("/booking/:orderId", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { orderId } = req.params;

      const order = await (prisma.order as any).findUnique({ where: { id: orderId } });
      if (!order) return errorResponse(res, 404, "Đơn hàng không tồn tại");
      if (order.userId !== userId) return errorResponse(res, 403, "Forbidden");
      if (!["PENDING", "PAYMENT_PROCESSING"].includes(order.status)) {
        return errorResponse(res, 409, "Không thể huỷ đơn hàng này");
      }

      await prisma.$transaction(async (tx) => {
        // Release seats
        await tx.seat.updateMany({
          where: { lockedBy: userId, lockedUntil: { not: null } },
          data: { status: "AVAILABLE", lockedUntil: null, lockedBy: null },
        });
        // Cancel tickets
        await (tx.ticket as any).updateMany({
          where: { orderId, status: { in: ["RESERVED", "CONFIRMED"] } },
          data: { status: "CANCELLED", cancelledAt: new Date() },
        });
        // Cancel order
        await (tx.order as any).update({ where: { id: orderId }, data: { status: "CANCELLED" } });
      });

      successResponse(res, { orderId }, "Đã huỷ đơn hàng");
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  return router;
}
