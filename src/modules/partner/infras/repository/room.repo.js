"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoomRepository = exports.RoomRepository = void 0;
class RoomRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(partnerId, data) {
        const { services: serviceIds, ...roomData } = data;
        const room = await this.prisma.room.create({
            data: {
                ...roomData,
                layoutSeat: roomData.layoutSeat || [],
                partnerId,
                services: serviceIds && serviceIds.length > 0
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
    async findById(roomId) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            include: { services: true },
        });
        return room ? this.formatRoom(room) : null;
    }
    async findByName(partnerId, name) {
        const room = await this.prisma.room.findFirst({
            where: { partnerId, name },
            include: { services: true },
        });
        return room ? this.formatRoom(room) : null;
    }
    async findMany(partnerId, paging) {
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
    async update(partnerId, roomId, data) {
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
    async delete(partnerId, roomId) {
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
    formatRoom(room) {
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
            services: (room.services ?? []).map((item) => item.serviceId),
            createdAt: room.createdAt,
            updatedAt: room.updatedAt,
        };
    }
}
exports.RoomRepository = RoomRepository;
const createRoomRepository = (prisma) => new RoomRepository(prisma);
exports.createRoomRepository = createRoomRepository;
