import { PrismaClient } from "@prisma/client";
import { IUserTicketRepository } from "@/modules/ticket/interface";
import { UserTicket, TicketListResult } from "@/modules/ticket/model/model";
import { ListTicketsDTO } from "@/modules/ticket/model/dto";

export class UserTicketRepository implements IUserTicketRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string, query: ListTicketsDTO): Promise<TicketListResult> {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) where.status = status;

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
      items: rows as unknown as UserTicket[],
      total,
      page,
      limit,
    };
  }

  async findByIdAndUserId(ticketId: string, userId: string): Promise<UserTicket | null> {
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

    return row ? (row as unknown as UserTicket) : null;
  }
}

export const createUserTicketRepository = (prisma: PrismaClient): IUserTicketRepository =>
  new UserTicketRepository(prisma);
