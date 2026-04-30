import { PrismaClient } from "@prisma/client";
import { ISeatRepository } from "@/modules/partner/interface/seat.interface";
import { Seat } from "@/modules/partner/model/model";
import { PagingDTO } from "@/share";

export class SeatRepository implements ISeatRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(_id: string): Promise<Seat | null> {
    return null;
  }
  async list(_cond: Partial<Seat>, _paging: PagingDTO): Promise<Seat[]> {
    return [];
  }
  async findByCond(_cond: Partial<Seat>): Promise<Seat | null> {
    return null;
  }

  async findById(seatId: string): Promise<Seat | null> {
    const row = await this.prisma.seat.findUnique({ where: { id: seatId } });
    return row ? (row as unknown as Seat) : null;
  }

  async findByShowtimeId(showtimeId: string): Promise<Seat[]> {
    const rows = await this.prisma.seat.findMany({
      where: { showtimeId },
      orderBy: { rowLabel: "asc" },
    });
    return rows as unknown as Seat[];
  }

  async findBySeatNumbers(showtimeId: string, seatNumbers: string[]): Promise<Seat[]> {
    const rows = await this.prisma.seat.findMany({
      where: { showtimeId, seatNumber: { in: seatNumbers } },
    });
    return rows as unknown as Seat[];
  }

  async updateStatus(
    seatId: string,
    status: string,
    lockedUntil?: Date,
    lockedBy?: string,
  ): Promise<boolean> {
    await this.prisma.seat.update({
      where: { id: seatId },
      data: {
        status: status as any,
        ...(lockedUntil !== undefined && { lockedUntil }),
        ...(lockedBy !== undefined && { lockedBy }),
      },
    });
    return true;
  }

  async updateBulkStatus(seatIds: string[], status: string): Promise<boolean> {
    await this.prisma.seat.updateMany({
      where: { id: { in: seatIds } },
      data: { status: status as any },
    });
    return true;
  }

  async insert(data: Seat): Promise<boolean> {
    await this.prisma.seat.create({ data: data as any });
    return true;
  }

  async update(id: string, data: Partial<Seat>): Promise<boolean> {
    await this.prisma.seat.update({ where: { id }, data: data as any });
    return true;
  }

  async delete(id: string, _isHard = false): Promise<boolean> {
    await this.prisma.seat.delete({ where: { id } });
    return true;
  }
}

export const createSeatRepository = (prisma: PrismaClient): ISeatRepository =>
  new SeatRepository(prisma);
