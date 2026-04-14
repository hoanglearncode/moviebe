import { PrismaClient } from "@prisma/client";
import { IShowtimeRepository } from "../../interface/showtime.interface";
import { Showtime } from "../../model/model";
import { UpdateShowtimeDTO, ListShowtimesQueryDTO } from "../../model/dto";
import { PagingDTO } from "../../../../share";

export class ShowtimeRepository implements IShowtimeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(_id: string): Promise<Showtime | null> { return null; }
  async list(_cond: Partial<Showtime>, _paging: PagingDTO): Promise<Showtime[]> { return []; }
  async findByCond(_cond: Partial<Showtime>): Promise<Showtime | null> { return null; }

  async findById(showtimeId: string): Promise<Showtime | null> {
    const row = await this.prisma.showtime.findUnique({ where: { id: showtimeId } });
    return row ? (row as unknown as Showtime) : null;
  }

  async findByPartnerId(
    partnerId: string,
    query: ListShowtimesQueryDTO,
  ): Promise<{ items: Showtime[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      sortBy = "startTime",
      sortOrder = "asc",
    } = query;
    const skip = (page - 1) * limit;
    const where: any = { partnerId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const [rows, total] = await Promise.all([
      this.prisma.showtime.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.showtime.count({ where }),
    ]);
    return { items: rows as unknown as Showtime[], total };
  }

  async findByIdAndPartnerId(showtimeId: string, partnerId: string): Promise<Showtime | null> {
    const row = await this.prisma.showtime.findFirst({ where: { id: showtimeId, partnerId } });
    return row ? (row as unknown as Showtime) : null;
  }

  async insert(data: Showtime): Promise<boolean> {
    await this.prisma.showtime.create({ data: data as any });
    return true;
  }

  async update(id: string, data: UpdateShowtimeDTO & { updatedAt?: Date }): Promise<boolean> {
    await this.prisma.showtime.update({ where: { id }, data: data as any });
    return true;
  }

  async delete(id: string, _isHard = false): Promise<boolean> {
    await this.prisma.showtime.delete({ where: { id } });
    return true;
  }

  async updateStatus(showtimeId: string, status: string): Promise<boolean> {
    await this.prisma.showtime.update({
      where: { id: showtimeId },
      data: { status: status as any },
    });
    return true;
  }

  async updateAvailableSeats(showtimeId: string, available: number): Promise<boolean> {
    await this.prisma.showtime.update({
      where: { id: showtimeId },
      data: { availableSeats: available },
    });
    return true;
  }
}

export const createShowtimeRepository = (prisma: PrismaClient): IShowtimeRepository =>
  new ShowtimeRepository(prisma);