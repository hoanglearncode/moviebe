"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieRepository = void 0;
const dto_1 = require("./dto");
class MovieRepository {
    constructor(prisma) {
        this.prisma = prisma;
        (0, dto_1.getMovieRepo)(this.prisma);
    }
    async getListMovies(cond, paging) {
        const { page, limit } = paging;
        const skip = (page - 1) * limit;
        const movies = await this.prisma.movie.findMany({
            skip,
            take: limit,
            where: {
                status: { in: ["APPROVED", "ACTIVE"] },
                ...(cond.search
                    ? { title: { contains: cond.search, mode: "insensitive" } }
                    : {}),
                ...(cond.genres
                    ? { genre: { hasSome: cond.genres.split(",").map((g) => g.trim()) } }
                    : {}),
            },
            include: {
                cast: { select: { name: true, role: true, photo: true } },
            },
            orderBy: { releaseDate: "desc" },
        });
        return movies;
    }
    async getMovieById(id) {
        const movie = await this.prisma.movie.findFirst({
            where: { id, status: { in: ["APPROVED", "ACTIVE"] } },
            include: {
                cast: { select: { id: true, name: true, role: true, photo: true } },
                reviews: {
                    where: { status: "APPROVED" },
                    include: {
                        user: { select: { id: true, name: true, avatar: true } },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 20,
                },
            },
        });
        return movie;
    }
    async getMovieShowtimes(movieId, date) {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        // const where: any = {
        //   movieId,
        //   status: "SCHEDULED",
        //   startTime: { gte: todayStart },
        // };
        if (date) {
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            //   where.startTime = { gte: dayStart, lte: dayEnd };
        }
        const rows = await this.prisma.showtime.findMany({
            //   where,
            include: {
                movie: {
                    select: {
                        id: true,
                        title: true,
                        posterUrl: true,
                        duration: true,
                        genre: true,
                        rating: true,
                    },
                },
                partner: {
                    select: { id: true, cinemaName: true, city: true, address: true },
                },
            },
            orderBy: { startTime: "asc" },
        });
        return rows;
    }
    async getShowtimeById(showtimeId) {
        const row = await this.prisma.showtime.findUnique({
            where: { id: showtimeId },
            include: {
                movie: {
                    select: {
                        id: true,
                        title: true,
                        posterUrl: true,
                        duration: true,
                        genre: true,
                        rating: true,
                    },
                },
                partner: {
                    select: { id: true, cinemaName: true, city: true, address: true },
                },
            },
        });
        return row ? row : null;
    }
    async getShowtimeSeatMap(showtimeId) {
        const showtime = await this.getShowtimeById(showtimeId);
        if (!showtime)
            return null;
        const now = new Date();
        // Auto-treat expired locks as available for display purposes
        await this.prisma.seat.updateMany({
            where: {
                showtimeId,
                status: "LOCKED",
                lockedUntil: { lt: now },
            },
            data: { status: "AVAILABLE", lockedUntil: null, lockedBy: null },
        });
        const [seats, room] = await Promise.all([
            this.prisma.seat.findMany({
                where: { showtimeId },
                orderBy: [{ rowLabel: "asc" }, { columnNumber: "asc" }],
            }),
            this.prisma.room.findUnique({
                where: { id: showtime.roomId },
                select: { layoutSeat: true, rows: true, seatsPerRow: true },
            }),
        ]);
        return {
            showtime,
            room: room
                ? {
                    layoutSeat: room.layoutSeat,
                    rows: room.rows,
                    seatsPerRow: room.seatsPerRow,
                }
                : null,
            seats: seats,
        };
    }
}
exports.MovieRepository = MovieRepository;
