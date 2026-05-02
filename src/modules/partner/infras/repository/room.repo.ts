import { PrismaClient } from "@prisma/client";
import { Room } from "@/modules/partner/model/model";
import { CreateRoomDTO, UpdateRoomDTO } from "@/modules/partner/model/dto";
import { PagingDTO } from "@/share";

export interface IRoomRepository {
  create(partnerId: string, data: CreateRoomDTO): Promise<Room>;
  findById(roomId: string): Promise<Room | null>;
  findByName(partnerId: string, name: string): Promise<Room | null>;
  findMany(partnerId: string, paging: PagingDTO): Promise<{ items: Room[]; total: number }>;
  update(partnerId: string, roomId: string, data: UpdateRoomDTO): Promise<Room>;
  delete(partnerId: string, roomId: string): Promise<boolean>;
}

export class RoomRepository implements IRoomRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(partnerId: string, data: CreateRoomDTO): Promise<Room> {
    const { services: serviceIds, ...roomData } = data;

    const room = await this.prisma.room.create({
      data: {
        ...roomData,
        layoutSeat: roomData.layoutSeat || [],
        partnerId,
        services:
          serviceIds && serviceIds.length > 0
            ? {
                create: serviceIds.map((serviceId) => ({
                  serviceId,
                })),
              }
            : undefined,
      },
      include: { services: true },
    });

    return this.formatRoom(room);
  }

  async findById(roomId: string): Promise<Room | null> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { services: true },
    });

    return room ? this.formatRoom(room) : null;
  }

  async findByName(partnerId: string, name: string): Promise<Room | null> {
    const room = await this.prisma.room.findFirst({
      where: { partnerId, name },
      include: { services: true },
    });

    return room ? this.formatRoom(room) : null;
  }

  async findMany(partnerId: string, paging: PagingDTO): Promise<{ items: Room[]; total: number }> {
    const [rooms, total] = await Promise.all([
      this.prisma.room.findMany({
        where: { partnerId },
        include: { services: true },
        take: paging.limit,
        skip: (paging.page - 1) * paging.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.room.count({ where: { partnerId } }),
    ]);

    return {
      items: rooms.map((room) => this.formatRoom(room)),
      total,
    };
  }

  async update(partnerId: string, roomId: string, data: UpdateRoomDTO): Promise<Room> {
    // Verify partner owns this room
    const existing = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!existing || existing.partnerId !== partnerId) {
      throw new Error("Room not found or unauthorized");
    }

    const { services: serviceIds, ...roomData } = data;

    // Update services if provided
    if (serviceIds !== undefined) {
      await this.prisma.roomService.deleteMany({
        where: { roomId },
      });

      if (serviceIds.length > 0) {
        await this.prisma.roomService.createMany({
          data: serviceIds.map((serviceId) => ({
            roomId,
            serviceId,
          })),
        });
      }
    }

    const room = await this.prisma.room.update({
      where: { id: roomId },
      data: roomData,
      include: { services: true },
    });

    return this.formatRoom(room);
  }

  async delete(partnerId: string, roomId: string): Promise<boolean> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room || room.partnerId !== partnerId) {
      throw new Error("Room not found or unauthorized");
    }

    await this.prisma.room.delete({
      where: { id: roomId },
    });

    return true;
  }

  private formatRoom(room: any): Room {
    return {
      id: room.id,
      partnerId: room.partnerId,
      name: room.name,
      type: room.type,
      status: room.status,
      rows: room.rows,
      seatsPerRow: room.seatsPerRow,
      tech: room.tech,
      screenWidth: room.screenWidth,
      screenHeight: room.screenHeight,
      screenPos: room.screenPos,
      aspectRatio: room.aspectRatio,
      entrancePos: room.entrancePos,
      aislePos: room.aislePos,
      layoutSeat: room.layoutSeat,
      allowOnlineBooking: room.allowOnlineBooking,
      allowSeatSelection: room.allowSeatSelection,
      maxBookingDays: room.maxBookingDays,
      maxSeatsPerTransaction: room.maxSeatsPerTransaction,
      buildYear: room.buildYear,
      lastRenovated: room.lastRenovated,
      description: room.description,
      internalNotes: room.internalNotes,
      services: (room.services ?? []).map((item: any) => item.serviceId),
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }
}

export const createRoomRepository = (prisma: PrismaClient): IRoomRepository =>
  new RoomRepository(prisma);
