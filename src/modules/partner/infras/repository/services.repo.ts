import { PrismaClient } from "@prisma/client";
import { PagingDTO } from "../../../../share";
import { IPartnerServiceRepository, AdminServiceListQuery } from "../../interface/services.interface";
import { CreateServiceDTO, UpdateServiceDTO } from "../../model/dto";
import { Services, AdminServiceRow } from "../../model/model";

export class Service implements IPartnerServiceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(partnerId: string, cond: any, paging: PagingDTO): Promise<{ items: Services[]; total: number }> {
    const where = this.buildWhere(partnerId, cond);

    const [rows, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        include: {
          rooms: {
            include: {
              room: true,
            },
          },
        },
        skip: (paging.page - 1) * paging.limit,
        take: paging.limit,
        orderBy: {
          id: "desc",
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.map(row)),
      total,
    };
  }

  async findById(partnerId: string, id: number): Promise<Services | null> {
    const row = await this.prisma.service.findFirst({
      where: { id, partnerId },
      include: {
        rooms: {
          include: {
            room: true,
          },
        },
      },
    });

    return row ? this.map(row) : null;
  }

  async findByCond(partnerId: string, cond: any): Promise<Services[]> {
    const rows = await this.prisma.service.findMany({
      where: this.buildWhere(partnerId, cond),
      include: {
        rooms: {
          include: {
            room: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    return rows.map((row) => this.map(row));
  }

  async insert(partnerId: string, data: CreateServiceDTO): Promise<Services> {
    const roomIds = Array.from(new Set(data.roomIds ?? []));
    await this.assertPartnerOwnsRooms(partnerId, roomIds);

    const row = await this.prisma.service.create({
      data: {
        partnerId,
        name: data.name,
        price: data.price,
        category: data.category,
        icon: data.icon ?? null,
        description: data.description ?? null,
        rooms: roomIds.length
          ? {
              create: roomIds.map((roomId) => ({
                roomId,
              })),
            }
          : undefined,
      },
      include: {
        rooms: {
          include: {
            room: true,
          },
        },
      },
    });

    return this.map(row);
  }

  async update(partnerId: string, id: number, data: UpdateServiceDTO): Promise<Services> {
    const roomIds = data.roomIds ? Array.from(new Set(data.roomIds)) : undefined;

    if (roomIds) {
      await this.assertPartnerOwnsRooms(partnerId, roomIds);
    }

    const row = await this.prisma.$transaction(async (tx) => {
      if (roomIds) {
        await tx.roomService.deleteMany({
          where: {
            serviceId: id,
            room: {
              partnerId,
            },
          },
        });
      }

      return await tx.service.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.price !== undefined && { price: data.price }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.icon !== undefined && { icon: data.icon }),
          ...(roomIds
            ? {
                rooms: {
                  create: roomIds.map((roomId) => ({
                    roomId,
                  })),
                },
              }
            : {}),
        },
        include: {
          rooms: {
            include: {
              room: true,
            },
          },
        },
      });
    });

    return this.map(row);
  }

  async delete(partnerId: string, id: number, _isHard: boolean): Promise<boolean> {
    await this.prisma.$transaction(async (tx) => {
      await tx.roomService.deleteMany({
        where: {
          serviceId: id,
          room: {
            partnerId,
          },
        },
      });

      await tx.service.delete({
        where: { id },
      });
    });

    return true;
  }

  async get(partnerId: string, id: number): Promise<Services | null> {
    return this.findById(partnerId, id);
  }

  async listAll(query: AdminServiceListQuery): Promise<{ items: AdminServiceRow[]; total: number }> {
    const { page = 1, limit = 20, keyword, category } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (keyword) where.name = { contains: keyword, mode: "insensitive" };
    if (category) where.category = category;

    const [rows, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: {
          rooms: { include: { room: true } },
          partner: { select: { cinemaName: true, logo: true } },
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({
        ...this.map(row),
        partnerName: row.partner?.cinemaName,
        partnerLogo: row.partner?.logo ?? null,
      })),
      total,
    };
  }

  private buildWhere(partnerId: string, cond: any) {
    return {
      partnerId,
      ...(cond.name && {
        name: {
          contains: cond.name,
          mode: "insensitive" as const,
        },
      }),
      ...(cond.price !== undefined && { price: cond.price }),
      ...(cond.category && { category: cond.category }),
      ...(cond.roomId && {
        rooms: {
          some: {
            roomId: cond.roomId,
          },
        },
      }),
    };
  }

  private async assertPartnerOwnsRooms(partnerId: string, roomIds: string[]): Promise<void> {
    if (!roomIds.length) {
      return;
    }

    const rooms = await this.prisma.room.findMany({
      where: {
        id: {
          in: roomIds,
        },
        partnerId,
      },
      select: {
        id: true,
      },
    });

    if (rooms.length !== roomIds.length) {
      throw new Error("One or more rooms do not belong to this partner");
    }
  }

  private map(row: any): Services {
    const roomLinks = row.rooms ?? [];

    return {
      id: row.id,
      partnerId: row.partnerId,
      name: row.name,
      price: row.price,
      category: row.category,
      icon: row.icon,
      description: row.description,
      roomIds: roomLinks.map((item: any) => item.roomId),
      rooms: roomLinks.map((item: any) => ({
        id: item.room.id,
        name: item.room.name,
        type: item.room.type,
        status: item.room.status,
      })),
    };
  }
}

export const createServerRepository = (prisma: PrismaClient): IPartnerServiceRepository =>
  new Service(prisma);
