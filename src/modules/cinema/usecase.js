"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CinemaUseCase = void 0;
class CinemaUseCase {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = {
            status: "ACTIVE",
        };
        if (query.city) {
            where.city = { contains: query.city, mode: "insensitive" };
        }
        if (query.search) {
            where.OR = [
                { cinemaName: { contains: query.search, mode: "insensitive" } },
                { address: { contains: query.search, mode: "insensitive" } },
                { city: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const orderBy = {};
        const sortBy = query.sortBy ?? "cinemaName";
        const sortOrder = query.sortOrder ?? "asc";
        if (sortBy === "name") {
            orderBy.cinemaName = sortOrder;
        }
        else if (sortBy === "city") {
            orderBy.city = sortOrder;
        }
        else {
            orderBy.createdAt = sortOrder;
        }
        const now = new Date();
        const [total, partners] = await Promise.all([
            this.prisma.partner.count({ where }),
            this.prisma.partner.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    cinemaName: true,
                    address: true,
                    city: true,
                    country: true,
                    phone: true,
                    email: true,
                    website: true,
                    logo: true,
                    lat: true,
                    lng: true,
                    description: true,
                    facilities: true,
                    createdAt: true,
                    _count: {
                        select: {
                            rooms: { where: { status: "ACTIVE" } },
                            showtimes: {
                                where: { status: "SCHEDULED", startTime: { gte: now } },
                            },
                            movies: { where: { status: "ACTIVE" } },
                        },
                    },
                },
            }),
        ]);
        const items = partners.map((p) => ({
            id: p.id,
            name: p.cinemaName,
            address: p.address,
            city: p.city,
            country: p.country,
            phone: p.phone,
            email: p.email,
            website: p.website,
            logo: p.logo,
            lat: p.lat,
            lng: p.lng,
            description: p.description,
            facilities: p.facilities,
            screens: p._count.rooms,
            activeShowtimes: p._count.showtimes,
            nowShowing: p._count.movies,
            createdAt: p.createdAt,
        }));
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getDetail(cinemaId) {
        const now = new Date();
        const partner = await this.prisma.partner.findUnique({
            where: { id: cinemaId, status: "ACTIVE" },
            select: {
                id: true,
                cinemaName: true,
                address: true,
                city: true,
                country: true,
                phone: true,
                email: true,
                website: true,
                logo: true,
                lat: true,
                lng: true,
                description: true,
                facilities: true,
                createdAt: true,
                rooms: {
                    where: { status: "ACTIVE" },
                    select: { id: true, name: true, type: true, capacity: true },
                },
                showtimes: {
                    where: { status: "SCHEDULED", startTime: { gte: now } },
                    take: 20,
                    orderBy: { startTime: "asc" },
                    select: {
                        id: true,
                        startTime: true,
                        endTime: true,
                        basePrice: true,
                        availableSeats: true,
                        totalSeats: true,
                        movie: {
                            select: { id: true, title: true, posterUrl: true, duration: true, rating: true },
                        },
                        room: { select: { id: true, name: true, type: true } },
                    },
                },
            },
        });
        if (!partner)
            return null;
        return {
            id: partner.id,
            name: partner.cinemaName,
            address: partner.address,
            city: partner.city,
            country: partner.country,
            phone: partner.phone,
            email: partner.email,
            website: partner.website,
            logo: partner.logo,
            lat: partner.lat,
            lng: partner.lng,
            description: partner.description,
            facilities: partner.facilities,
            rooms: partner.rooms,
            upcomingShowtimes: partner.showtimes,
        };
    }
    async getCities() {
        const cities = await this.prisma.partner.findMany({
            where: { status: "ACTIVE" },
            select: { city: true },
            distinct: ["city"],
            orderBy: { city: "asc" },
        });
        return cities.map((c) => c.city).filter(Boolean);
    }
}
exports.CinemaUseCase = CinemaUseCase;
