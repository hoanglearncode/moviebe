"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShowtimeRepository = exports.ShowtimeRepository = void 0;
class ShowtimeRepository {
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
    async findById(showtimeId) {
        const row = await this.prisma.showtime.findUnique({ where: { id: showtimeId } });
        return row ? row : null;
    }
    async findByPartnerId(partnerId, query) {
        const { page = 1, limit = 20, status, startDate, endDate, sortBy = "startTime", sortOrder = "asc", } = query;
        const skip = (page - 1) * limit;
        const where = { partnerId };
        if (status)
            where.status = status;
        if (startDate || endDate) {
            where.startTime = {};
            if (startDate)
                where.startTime.gte = new Date(startDate);
            if (endDate)
                where.startTime.lte = new Date(endDate);
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
        return { items: rows, total };
    }
    async findByIdAndPartnerId(showtimeId, partnerId) {
        const row = await this.prisma.showtime.findFirst({ where: { id: showtimeId, partnerId } });
        return row ? row : null;
    }
    async insert(data) {
        await this.prisma.showtime.create({
            data: {
                id: data.id,
                movieId: data.movieId,
                partnerId: data.partnerId,
                roomId: data.roomId,
                startTime: data.startTime,
                endTime: data.endTime,
                basePrice: data.basePrice,
                priceConfig: (data.priceConfig ?? {}),
                status: data.status,
                totalSeats: data.totalSeats,
                availableSeats: data.availableSeats,
                bookedSeats: data.bookedSeats,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
            },
        });
        return true;
    }
    async update(id, data) {
        await this.prisma.showtime.update({ where: { id }, data: data });
        return true;
    }
    async delete(id, _isHard = false) {
        await this.prisma.showtime.delete({ where: { id } });
        return true;
    }
    async updateStatus(showtimeId, status) {
        await this.prisma.showtime.update({
            where: { id: showtimeId },
            data: { status: status },
        });
        return true;
    }
    async updateAvailableSeats(showtimeId, available) {
        await this.prisma.showtime.update({
            where: { id: showtimeId },
            data: { availableSeats: available },
        });
        return true;
    }
}
exports.ShowtimeRepository = ShowtimeRepository;
const createShowtimeRepository = (prisma) => new ShowtimeRepository(prisma);
exports.createShowtimeRepository = createShowtimeRepository;
