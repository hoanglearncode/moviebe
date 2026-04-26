"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBookingRepository = exports.BookingRepository = void 0;
const crypto_1 = require("crypto");
const error_1 = require("../../model/error");
class BookingRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOrderById(orderId) {
        const row = await this.prisma.order.findUnique({ where: { id: orderId } });
        return row ? row : null;
    }
    async findOrderWithDetails(orderId) {
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
                        seat: {
                            select: { seatNumber: true, rowLabel: true, seatType: true },
                        },
                    },
                    orderBy: { seatNumber: "asc" },
                },
            },
        });
        return row ? row : null;
    }
    async updateOrder(id, data) {
        await this.prisma.order.update({ where: { id }, data: data });
        return true;
    }
    async lockSeatsAtomic(params) {
        const { userId, showtimeId, seatIds } = params;
        return this.prisma.$transaction(async (tx) => {
            // 1. Get showtime with partner commission rate
            const showtime = await tx.showtime.findUnique({
                where: { id: showtimeId },
                include: {
                    partner: { select: { commissionRate: true } },
                },
            });
            if (!showtime)
                throw new error_1.ShowtimeNotFoundError();
            if (showtime.status !== "SCHEDULED") {
                throw new error_1.ShowtimeNotAvailableError(`Showtime is ${showtime.status.toLowerCase()} and not available for booking`);
            }
            // 2. Get and validate seats
            const seats = await tx.seat.findMany({
                where: { id: { in: seatIds }, showtimeId },
            });
            if (seats.length !== seatIds.length) {
                throw new error_1.ShowtimeNotAvailableError("One or more seats not found for this showtime");
            }
            const now = new Date();
            // Treat expired locks as available
            const unavailable = seats.filter((s) => s.status === "BOOKED" ||
                s.status === "MAINTENANCE" ||
                (s.status === "LOCKED" && s.lockedUntil && s.lockedUntil > now));
            if (unavailable.length > 0) {
                throw new error_1.SeatsNotAvailableError(unavailable.map((s) => s.seatNumber));
            }
            // 3. Calculate totals
            const commissionRate = showtime.partner?.commissionRate ?? 0.1;
            const totalAmount = seats.reduce((sum, s) => sum + s.price, 0);
            const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 min lock
            // 4. Create order
            const orderId = (0, crypto_1.randomUUID)();
            await tx.order.create({
                data: {
                    id: orderId,
                    userId,
                    showtimeId,
                    partnerId: showtime.partnerId,
                    status: "PENDING",
                    totalAmount,
                    discountAmount: 0,
                    finalAmount: totalAmount,
                    expiresAt,
                    createdAt: now,
                    updatedAt: now,
                },
            });
            // 5. Create tickets and lock seats
            for (const seat of seats) {
                const partnerAmount = Math.round(seat.price * (1 - commissionRate));
                const platformFee = seat.price - partnerAmount;
                await tx.ticket.create({
                    data: {
                        id: (0, crypto_1.randomUUID)(),
                        userId,
                        orderId,
                        showtimeId,
                        partnerId: showtime.partnerId,
                        movieId: showtime.movieId,
                        seatId: seat.id,
                        seatNumber: seat.seatNumber,
                        purchasePrice: seat.price,
                        partnerAmount,
                        platformFee,
                        status: "RESERVED",
                        qrCode: (0, crypto_1.randomUUID)(),
                        purchasedAt: now,
                        createdAt: now,
                        updatedAt: now,
                    },
                });
                await tx.seat.update({
                    where: { id: seat.id },
                    data: {
                        status: "LOCKED",
                        lockedUntil: expiresAt,
                        lockedBy: orderId,
                        updatedAt: now,
                    },
                });
            }
            // 6. Decrement available seats
            await tx.showtime.update({
                where: { id: showtimeId },
                data: {
                    availableSeats: { decrement: seatIds.length },
                    updatedAt: now,
                },
            });
            return {
                orderId,
                expiresAt: expiresAt.toISOString(),
                seats: seats.map((s) => ({ id: s.id, seatNumber: s.seatNumber, price: s.price })),
                totalAmount,
            };
        });
    }
    async releaseOrderSeats(orderId) {
        await this.prisma.$transaction(async (tx) => {
            const tickets = await tx.ticket.findMany({
                where: { orderId, status: { in: ["RESERVED", "CONFIRMED"] } },
            });
            if (tickets.length === 0)
                return;
            const seatIds = tickets.map((t) => t.seatId);
            const showtimeId = tickets[0].showtimeId;
            // Release seats back to AVAILABLE
            await tx.seat.updateMany({
                where: { id: { in: seatIds }, status: "LOCKED" },
                data: {
                    status: "AVAILABLE",
                    lockedUntil: null,
                    lockedBy: null,
                    updatedAt: new Date(),
                },
            });
            // Restore showtime available count
            await tx.showtime.update({
                where: { id: showtimeId },
                data: {
                    availableSeats: { increment: seatIds.length },
                    updatedAt: new Date(),
                },
            });
            // Cancel tickets
            await tx.ticket.updateMany({
                where: { orderId, status: { in: ["RESERVED"] } },
                data: { status: "CANCELLED", cancelledAt: new Date(), updatedAt: new Date() },
            });
        });
    }
}
exports.BookingRepository = BookingRepository;
const createBookingRepository = (prisma) => new BookingRepository(prisma);
exports.createBookingRepository = createBookingRepository;
