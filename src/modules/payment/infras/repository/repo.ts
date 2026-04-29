import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { IPaymentRepository } from "../../interface";
import { CreatePaymentResult, ConfirmMockResult, PaymentMethod } from "../../model/model";
import { OrderWithDetails } from "../../../booking/model/model";
import {
  PaymentOrderNotFoundError,
  OrderNotPendingError,
  PaymentAccessDeniedError,
} from "../../model/error";
import { ENV } from "../../../../share/common/value";

export class PaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createPaymentForOrder(
    userId: string,
    orderId: string,
    paymentMethod: PaymentMethod,
  ): Promise<CreatePaymentResult> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new PaymentOrderNotFoundError();
    if (order.userId !== userId) throw new PaymentAccessDeniedError();
    if (order.status !== "PENDING") throw new OrderNotPendingError(order.status);

    const now = new Date();
    // Generate deterministic-ish gateway ref for this order
    const gatewayRef = `MOCK-${orderId.slice(0, 8).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;

    // Create transaction record
    const transactionId = randomUUID();
    await this.prisma.transaction.create({
      data: {
        id: transactionId,
        userId,
        partnerId: order.partnerId,
        orderId,
        type: "TICKET_SALE",
        status: "PENDING",
        amount: order.finalAmount,
        paymentMethod,
        paymentGatewayRef: gatewayRef,
        description: `Payment for order ${orderId} via ${paymentMethod}`,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Update order to PAYMENT_PROCESSING
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: "PAYMENT_PROCESSING", updatedAt: now },
    });

    // Build mock redirect URL to FE result page
    const frontendUrl = ENV.FRONTEND_URL.replace(/\/$/, "");
    const paymentUrl = `${frontendUrl}/booking/result?orderId=${orderId}&gatewayRef=${gatewayRef}&mock=1&method=${paymentMethod}`;

    return { paymentUrl, transactionId };
  }

  async getOrderStatus(userId: string, orderId: string): Promise<OrderWithDetails> {
    const row = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        showtime: {
          include: {
            movie: {
              select: {
                id: true,
                title: true,
                posterUrl: true,
                duration: true,
                genre: true,
                rating: true,
              },
            },
            partner: {
              select: { id: true, cinemaName: true, city: true, address: true },
            },
          },
        },
        tickets: {
          include: {
            seat: { select: { seatNumber: true, rowLabel: true, seatType: true } },
          },
          orderBy: { seatNumber: "asc" },
        },
      },
    });

    if (!row) throw new PaymentOrderNotFoundError();
    if (row.userId !== userId) throw new PaymentAccessDeniedError();

    return row as unknown as OrderWithDetails;
  }

  async confirmMockPayment(
    orderId: string,
    gatewayRef: string,
    status: "SUCCESS" | "FAILED",
  ): Promise<ConfirmMockResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { tickets: true },
    });

    if (!order) throw new PaymentOrderNotFoundError();

    // Idempotency: already processed
    if (order.status === "COMPLETED") return { orderId, status: "COMPLETED" };
    if (order.status === "CANCELLED" || order.status === "EXPIRED") {
      return { orderId, status: order.status };
    }

    const now = new Date();

    if (status === "SUCCESS") {
      await this.prisma.$transaction(async (tx) => {
        const ticketIds = order.tickets.map((t) => t.id);
        const seatIds = order.tickets.map((t) => t.seatId);

        // Confirm tickets
        await tx.ticket.updateMany({
          where: { id: { in: ticketIds } },
          data: { status: "CONFIRMED", updatedAt: now },
        });

        // Mark seats as BOOKED
        await tx.seat.updateMany({
          where: { id: { in: seatIds } },
          data: {
            status: "BOOKED",
            lockedUntil: null,
            lockedBy: null,
            updatedAt: now,
          },
        });

        // Increment showtime booked seats
        await tx.showtime.update({
          where: { id: order.showtimeId },
          data: {
            bookedSeats: { increment: ticketIds.length },
            updatedAt: now,
          },
        });

        // Credit partner wallet
        const totalPartnerAmount = order.tickets.reduce((sum, t) => sum + t.partnerAmount, 0);

        await tx.partnerWallet.upsert({
          where: { partnerId: order.partnerId },
          create: {
            id: randomUUID(),
            partnerId: order.partnerId,
            balance: totalPartnerAmount,
            totalEarned: totalPartnerAmount,
            totalWithdrawn: 0,
            totalRefunded: 0,
            createdAt: now,
            updatedAt: now,
          },
          update: {
            balance: { increment: totalPartnerAmount },
            totalEarned: { increment: totalPartnerAmount },
            updatedAt: now,
          },
        });

        // Record partner revenue transaction
        await tx.transaction.create({
          data: {
            id: randomUUID(),
            partnerId: order.partnerId,
            userId: order.userId,
            orderId: order.id,
            type: "TICKET_SALE",
            status: "COMPLETED",
            amount: totalPartnerAmount,
            paymentGatewayRef: gatewayRef,
            description: `Revenue for order ${orderId}`,
            createdAt: now,
            updatedAt: now,
          },
        });

        // Update pending transaction to COMPLETED
        await tx.transaction.updateMany({
          where: { orderId, status: "PENDING", type: "TICKET_SALE" },
          data: { status: "COMPLETED", updatedAt: now },
        });

        // Complete the order
        await tx.order.update({
          where: { id: orderId },
          data: { status: "COMPLETED", updatedAt: now },
        });
      });

      return { orderId, status: "COMPLETED" };
    } else {
      // FAILED — release seats and cancel order
      await this.prisma.$transaction(async (tx) => {
        const seatIds = order.tickets.map((t) => t.seatId);

        await tx.ticket.updateMany({
          where: { orderId, status: { in: ["RESERVED"] } },
          data: { status: "CANCELLED", cancelledAt: now, updatedAt: now },
        });

        await tx.seat.updateMany({
          where: { id: { in: seatIds }, status: "LOCKED" },
          data: {
            status: "AVAILABLE",
            lockedUntil: null,
            lockedBy: null,
            updatedAt: now,
          },
        });

        await tx.showtime.update({
          where: { id: order.showtimeId },
          data: {
            availableSeats: { increment: seatIds.length },
            updatedAt: now,
          },
        });

        await tx.transaction.updateMany({
          where: { orderId, status: "PENDING", type: "TICKET_SALE" },
          data: { status: "FAILED", updatedAt: now },
        });

        await tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED", updatedAt: now },
        });
      });

      return { orderId, status: "CANCELLED" };
    }
  }
}

export const createPaymentRepository = (prisma: PrismaClient): IPaymentRepository =>
  new PaymentRepository(prisma);
