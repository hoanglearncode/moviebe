"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckInRepository = exports.createTicketRepository = exports.CheckInRepository = exports.TicketRepository = void 0;
class TicketRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async get(_id) {
        return null;
    }
    async list(_cond, _paging) {
        return [];
    }
    async findByCond(_cond) {
        return null;
    }
    async findById(ticketId) {
        const row = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
        return row ? row : null;
    }
    async findByQRCode(qrCode) {
        const row = await this.prisma.ticket.findFirst({ where: { qrCode } });
        return row ? row : null;
    }
    async findByPartnerId(partnerId, query) {
        const { page = 1, limit = 20, status, startDate, endDate } = query;
        const skip = (page - 1) * limit;
        const where = { partnerId };
        if (status)
            where.status = status;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const [rows, total] = await Promise.all([
            this.prisma.ticket.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
            this.prisma.ticket.count({ where }),
        ]);
        return {
            items: rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findByShowtimeId(showtimeId) {
        const rows = await this.prisma.ticket.findMany({
            where: { showtimeId },
            orderBy: { createdAt: "desc" },
        });
        return rows;
    }
    async updateStatus(ticketId, status) {
        await this.prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status: status,
                ...(status === "USED" ? { usedAt: new Date() } : {}),
                ...(status === "CANCELLED" ? { cancelledAt: new Date() } : {}),
            },
        });
        return true;
    }
    async insert(data) {
        await this.prisma.ticket.create({ data: data });
        return true;
    }
    async update(id, data) {
        await this.prisma.ticket.update({ where: { id }, data: data });
        return true;
    }
    async delete(id, _isHard = false) {
        await this.prisma.ticket.delete({ where: { id } });
        return true;
    }
}
exports.TicketRepository = TicketRepository;
class CheckInRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async get(_id) {
        return null;
    }
    async list(_cond, _paging) {
        return [];
    }
    async findByCond(_cond) {
        return null;
    }
    async findByTicketId(ticketId) {
        const row = await this.prisma.checkIn.findFirst({ where: { ticketId } });
        return row ? row : null;
    }
    async findByShowtimeId(showtimeId) {
        const rows = await this.prisma.checkIn.findMany({ where: { showtimeId } });
        return rows;
    }
    async countByShowtimeId(showtimeId) {
        return this.prisma.checkIn.count({ where: { showtimeId } });
    }
    async insert(data) {
        await this.prisma.checkIn.create({ data: data });
        return true;
    }
    async update(id, data) {
        await this.prisma.checkIn.update({ where: { id }, data: data });
        return true;
    }
    async delete(id, _isHard = false) {
        await this.prisma.checkIn.delete({ where: { id } });
        return true;
    }
}
exports.CheckInRepository = CheckInRepository;
const createTicketRepository = (prisma) => new TicketRepository(prisma);
exports.createTicketRepository = createTicketRepository;
const createCheckInRepository = (prisma) => new CheckInRepository(prisma);
exports.createCheckInRepository = createCheckInRepository;
