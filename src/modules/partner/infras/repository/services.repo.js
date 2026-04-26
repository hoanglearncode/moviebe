"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServerRepository = exports.Service = void 0;
class Service {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(partnerId, cond, paging) {
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
    async findById(partnerId, id) {
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
    async findByCond(partnerId, cond) {
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
    async insert(partnerId, data) {
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
    async update(partnerId, id, data) {
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
    async delete(partnerId, id, _isHard) {
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
    async get(partnerId, id) {
        return this.findById(partnerId, id);
    }
    async listAll(query) {
        const { page = 1, limit = 20, keyword, category } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (keyword)
            where.name = { contains: keyword, mode: "insensitive" };
        if (category)
            where.category = category;
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
    buildWhere(partnerId, cond) {
        return {
            partnerId,
            ...(cond.name && {
                name: {
                    contains: cond.name,
                    mode: "insensitive",
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
    async assertPartnerOwnsRooms(partnerId, roomIds) {
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
    map(row) {
        const roomLinks = row.rooms ?? [];
        return {
            id: row.id,
            partnerId: row.partnerId,
            name: row.name,
            price: row.price,
            category: row.category,
            icon: row.icon,
            description: row.description,
            roomIds: roomLinks.map((item) => item.roomId),
            rooms: roomLinks.map((item) => ({
                id: item.room.id,
                name: item.room.name,
                type: item.room.type,
                status: item.room.status,
            })),
        };
    }
}
exports.Service = Service;
const createServerRepository = (prisma) => new Service(prisma);
exports.createServerRepository = createServerRepository;
