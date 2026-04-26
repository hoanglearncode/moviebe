"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMovieRepository = exports.MovieRepository = void 0;
// ─── Mapper ───────────────────────────────────────────────────────────────────
/**
 * Converts a raw Prisma row (which may include a nested `cast` array) into the
 * domain Movie model. The cast relation is included only when explicitly
 * requested via `include: { cast: true }`.
 */
function toMovieDomain(row) {
    return {
        id: row.id,
        partnerId: row.partnerId,
        title: row.title,
        description: row.description ?? null,
        genre: row.genre ?? [],
        language: row.language,
        duration: row.duration,
        releaseDate: row.releaseDate,
        endDate: row.endDate,
        rating: row.rating ?? null,
        status: row.status,
        posterUrl: row.posterUrl ?? null,
        backdropUrl: row.backdropUrl ?? null,
        trailerUrl: row.trailerUrl ?? null,
        altTitle: row.altTitle ?? null,
        director: row.director ?? null,
        year: row.year ?? null,
        country: row.country ?? null,
        tags: row.tags ?? [],
        cast: Array.isArray(row.cast)
            ? row.cast.map((c) => ({
                id: c.id,
                movieId: c.movieId,
                name: c.name,
                role: c.role,
                photo: c.photo ?? null,
                order: c.order ?? 0,
            }))
            : undefined,
        allowComments: row.allowComments ?? true,
        publishedAt: row.publishedAt ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
// ─── Repository ───────────────────────────────────────────────────────────────
class MovieRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ── IRepository stubs (not used by partner module) ──────────────────────────
    async get(_id) {
        return null;
    }
    async list(_cond, _paging) {
        return [];
    }
    async findByCond(_cond) {
        return null;
    }
    // ── Queries ─────────────────────────────────────────────────────────────────
    async findById(movieId) {
        const row = await this.prisma.movie.findUnique({
            where: { id: movieId },
            include: { cast: { orderBy: { order: "asc" } } },
        });
        return row ? toMovieDomain(row) : null;
    }
    async findByPartnerId(partnerId, query) {
        const { page = 1, limit = 20, status, keyword, sortBy = "createdAt", sortOrder = "desc", } = query;
        const skip = (page - 1) * limit;
        const where = { partnerId };
        if (status)
            where.status = status;
        if (keyword)
            where.title = { contains: keyword, mode: "insensitive" };
        const [rows, total] = await Promise.all([
            this.prisma.movie.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: { cast: { orderBy: { order: "asc" } } },
            }),
            this.prisma.movie.count({ where }),
        ]);
        return { items: rows.map(toMovieDomain), total };
    }
    async findByIdAndPartnerId(movieId, partnerId) {
        const row = await this.prisma.movie.findFirst({
            where: { id: movieId, partnerId },
            include: { cast: { orderBy: { order: "asc" } } },
        });
        return row ? toMovieDomain(row) : null;
    }
    // ── Mutations ────────────────────────────────────────────────────────────────
    /**
     * Insert a new movie row.
     * Cast is NOT inserted here — call `replaceCast` after this if needed.
     */
    async insert(data) {
        const { cast: _cast, ...scalarFields } = data;
        await this.prisma.movie.create({
            data: {
                id: scalarFields.id,
                partnerId: scalarFields.partnerId,
                title: scalarFields.title,
                description: scalarFields.description,
                genre: scalarFields.genre,
                language: scalarFields.language,
                duration: scalarFields.duration,
                releaseDate: scalarFields.releaseDate,
                endDate: scalarFields.endDate,
                rating: scalarFields.rating,
                status: scalarFields.status,
                posterUrl: scalarFields.posterUrl,
                backdropUrl: scalarFields.backdropUrl,
                trailerUrl: scalarFields.trailerUrl,
                altTitle: scalarFields.altTitle,
                director: scalarFields.director,
                year: scalarFields.year,
                country: scalarFields.country,
                tags: scalarFields.tags ?? [],
                allowComments: scalarFields.allowComments,
                publishedAt: scalarFields.publishedAt,
                createdAt: scalarFields.createdAt,
                updatedAt: scalarFields.updatedAt,
            },
        });
        return true;
    }
    async update(id, data) {
        const { cast: _cast, id: _id, partnerId: _pid, ...rest } = data;
        await this.prisma.movie.update({
            where: { id },
            data: rest,
        });
        return true;
    }
    async updateStatus(movieId, status) {
        await this.prisma.movie.update({
            where: { id: movieId },
            data: { status: status },
        });
        return true;
    }
    async delete(id, _isHard = false) {
        // Cast rows are deleted automatically via ON DELETE CASCADE
        await this.prisma.movie.delete({ where: { id } });
        return true;
    }
    async findAllForAdmin(query) {
        const { page = 1, limit = 20, status, keyword, sortBy = "createdAt", sortOrder = "desc", } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (keyword)
            where.title = { contains: keyword, mode: "insensitive" };
        const [rows, total] = await Promise.all([
            this.prisma.movie.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    cast: { orderBy: { order: "asc" } },
                    partner: {
                        select: { id: true, cinemaName: true, logo: true, email: true, city: true },
                    },
                },
            }),
            this.prisma.movie.count({ where }),
        ]);
        return {
            items: rows.map((row) => ({
                ...toMovieDomain(row),
                partner: row.partner
                    ? {
                        id: row.partner.id,
                        cinemaName: row.partner.cinemaName,
                        logo: row.partner.logo,
                        email: row.partner.email,
                        city: row.partner.city,
                    }
                    : undefined,
            })),
            total,
        };
    }
    async getMovieStats() {
        const [submitted, approved, rejected, active] = await Promise.all([
            this.prisma.movie.count({ where: { status: "SUBMITTED" } }),
            this.prisma.movie.count({ where: { status: "APPROVED" } }),
            this.prisma.movie.count({ where: { status: "REJECTED" } }),
            this.prisma.movie.count({ where: { status: "ACTIVE" } }),
        ]);
        return { submitted, approved, rejected, active, total: submitted + approved + rejected + active };
    }
    /**
     * Replace the entire cast list for a movie atomically:
     * deletes all existing rows then inserts the new ones.
     * Pass an empty array to clear cast.
     */
    async replaceCast(movieId, cast) {
        await this.prisma.$transaction([
            this.prisma.cast.deleteMany({ where: { movieId } }),
            ...(cast.length
                ? [
                    this.prisma.cast.createMany({
                        data: cast.map((c, index) => ({
                            id: c.id,
                            movieId,
                            name: c.name,
                            role: c.role ?? "",
                            photo: c.photo ?? null,
                            order: c.order ?? index,
                        })),
                    }),
                ]
                : []),
        ]);
    }
}
exports.MovieRepository = MovieRepository;
const createMovieRepository = (prisma) => new MovieRepository(prisma);
exports.createMovieRepository = createMovieRepository;
