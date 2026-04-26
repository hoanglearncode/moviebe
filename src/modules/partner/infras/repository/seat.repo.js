"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSeatRepository = exports.SeatRepository = void 0;
class SeatRepository {
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
    async findById(seatId) {
        const row = await this.prisma.seat.findUnique({ where: { id: seatId } });
        return row ? row : null;
    }
    async findByShowtimeId(showtimeId) {
        const rows = await this.prisma.seat.findMany({
            where: { showtimeId },
            orderBy: { rowLabel: "asc" },
        });
        return rows;
    }
    async findBySeatNumbers(showtimeId, seatNumbers) {
        const rows = await this.prisma.seat.findMany({
            where: { showtimeId, seatNumber: { in: seatNumbers } },
        });
        return rows;
    }
    async updateStatus(seatId, status, lockedUntil, lockedBy) {
        await this.prisma.seat.update({
            where: { id: seatId },
            data: {
                status: status,
                ...(lockedUntil !== undefined && { lockedUntil }),
                ...(lockedBy !== undefined && { lockedBy }),
            },
        });
        return true;
    }
    async updateBulkStatus(seatIds, status) {
        await this.prisma.seat.updateMany({
            where: { id: { in: seatIds } },
            data: { status: status },
        });
        return true;
    }
    async insert(data) {
        await this.prisma.seat.create({ data: data });
        return true;
    }
    async update(id, data) {
        await this.prisma.seat.update({ where: { id }, data: data });
        return true;
    }
    async delete(id, _isHard = false) {
        await this.prisma.seat.delete({ where: { id } });
        return true;
    }
}
exports.SeatRepository = SeatRepository;
const createSeatRepository = (prisma) => new SeatRepository(prisma);
exports.createSeatRepository = createSeatRepository;
