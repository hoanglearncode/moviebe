import { PrismaClient } from "@prisma/client";
import {
  ITicketRepository,
  ICheckInRepository,
} from "@/modules/partner/interface/ticket.interface";
import { Ticket, CheckIn, TicketListResponse } from "@/modules/partner/model/model";
import { ListTicketsQueryDTO } from "@/modules/partner/model/dto";
import { PagingDTO } from "@/share";

export class TicketRepository implements ITicketRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(_id: string): Promise<Ticket | null> {
    return null;
  }
  async list(_cond: Partial<Ticket>, _paging: PagingDTO): Promise<Ticket[]> {
    return [];
  }
  async findByCond(_cond: Partial<Ticket>): Promise<Ticket | null> {
    return null;
  }

  async findById(ticketId: string): Promise<Ticket | null> {
    const row = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    return row ? (row as unknown as Ticket) : null;
  }

  async findByQRCode(qrCode: string): Promise<Ticket | null> {
    const row = await (this.prisma.ticket.findFirst as any)({ where: { qrCode } });
    return row ? (row as unknown as Ticket) : null;
  }

  async findByPartnerId(
    partnerId: string,
    query: ListTicketsQueryDTO,
  ): Promise<TicketListResponse> {
    const { page = 1, limit = 20, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;
    const where: any = { partnerId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [rows, total] = await Promise.all([
      this.prisma.ticket.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      items: rows as unknown as Ticket[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByShowtimeId(showtimeId: string): Promise<Ticket[]> {
    const rows = await this.prisma.ticket.findMany({
      where: { showtimeId },
      orderBy: { createdAt: "desc" },
    });
    return rows as unknown as Ticket[];
  }

  async updateStatus(ticketId: string, status: string): Promise<boolean> {
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: status as any,
        ...(status === "USED" ? { usedAt: new Date() } : {}),
        ...(status === "CANCELLED" ? { cancelledAt: new Date() } : {}),
      },
    });
    return true;
  }

  async insert(data: Ticket): Promise<boolean> {
    await this.prisma.ticket.create({ data: data as any });
    return true;
  }

  async update(id: string, data: Partial<Ticket>): Promise<boolean> {
    await this.prisma.ticket.update({ where: { id }, data: data as any });
    return true;
  }

  async delete(id: string, _isHard = false): Promise<boolean> {
    await this.prisma.ticket.delete({ where: { id } });
    return true;
  }
}

export class CheckInRepository implements ICheckInRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(_id: string): Promise<CheckIn | null> {
    return null;
  }
  async list(_cond: Partial<CheckIn>, _paging: PagingDTO): Promise<CheckIn[]> {
    return [];
  }
  async findByCond(_cond: Partial<CheckIn>): Promise<CheckIn | null> {
    return null;
  }

  async findByTicketId(ticketId: string): Promise<CheckIn | null> {
    const row = await this.prisma.checkIn.findFirst({ where: { ticketId } });
    return row ? (row as unknown as CheckIn) : null;
  }

  async findByShowtimeId(showtimeId: string): Promise<CheckIn[]> {
    const rows = await this.prisma.checkIn.findMany({ where: { showtimeId } });
    return rows as unknown as CheckIn[];
  }

  async countByShowtimeId(showtimeId: string): Promise<number> {
    return this.prisma.checkIn.count({ where: { showtimeId } });
  }

  async insert(data: CheckIn): Promise<boolean> {
    await this.prisma.checkIn.create({ data: data as any });
    return true;
  }

  async update(id: string, data: Partial<CheckIn>): Promise<boolean> {
    await this.prisma.checkIn.update({ where: { id }, data: data as any });
    return true;
  }

  async delete(id: string, _isHard = false): Promise<boolean> {
    await this.prisma.checkIn.delete({ where: { id } });
    return true;
  }
}

export const createTicketRepository = (prisma: PrismaClient): ITicketRepository =>
  new TicketRepository(prisma);

export const createCheckInRepository = (prisma: PrismaClient): ICheckInRepository =>
  new CheckInRepository(prisma);
