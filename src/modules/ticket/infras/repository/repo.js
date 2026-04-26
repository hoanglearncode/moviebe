"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserTicketRepository = exports.UserTicketRepository = void 0;
class UserTicketRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByUserId(userId, query) {
        const { page = 1, limit = 10, status } = query;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (status)
            where.status = status;
        const [rows, total] = await Promise.all([
            this.prisma.ticket.findMany({
                where,
                skip,
                take: limit,
                orderBy: { purchasedAt: "desc" },
                include: {
                    showtime: {
                        include: {
                            movie: {
                                select: {
                                    id: true,
                                    title: true,
                                    posterUrl: true,
                                    genre: true,
                                    duration: true,
                                    rating: true,
                                    language: true,
                                },
                            },
                            partner: {
                                select: { cinemaName: true, city: true, address: true, phone: true },
                            },
                        },
                    },
                    seat: {
                        select: { seatNumber: true, rowLabel: true, columnNumber: true, seatType: true },
                    },
                    checkIn: {
                        select: { scannedAt: true, scannedBy: true },
                    },
                },
            }),
            this.prisma.ticket.count({ where }),
        ]);
        return {
            items: rows,
            total,
            page,
            limit,
        };
    }
    async findByIdAndUserId(ticketId, userId) {
        const row = await this.prisma.ticket.findFirst({
            where: { id: ticketId, userId },
            include: {
                showtime: {
                    include: {
                        movie: {
                            select: {
                                id: true,
                                title: true,
                                posterUrl: true,
                                genre: true,
                                duration: true,
                                rating: true,
                                language: true,
                            },
                        },
                        partner: {
                            select: { cinemaName: true, city: true, address: true, phone: true },
                        },
                    },
                },
                seat: {
                    select: { seatNumber: true, rowLabel: true, columnNumber: true, seatType: true },
                },
                checkIn: {
                    select: { scannedAt: true, scannedBy: true },
                },
            },
        });
        return row ? row : null;
    }
}
exports.UserTicketRepository = UserTicketRepository;
const createUserTicketRepository = (prisma) => new UserTicketRepository(prisma);
exports.createUserTicketRepository = createUserTicketRepository;
