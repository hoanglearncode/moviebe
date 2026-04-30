import { PrismaClient } from "@prisma/client";
import { IMovieRepository } from "@/modules/partner/interface/movie.interface";
import { Movie, CastMember, AdminMovieRow, AdminMovieStats } from "@/modules/partner/model/model";
import { ListMoviesQueryDTO } from "@/modules/partner/model/dto";
import { PagingDTO } from "@/share";

// ─── Mapper ───────────────────────────────────────────────────────────────────

/**
 * Converts a raw Prisma row (which may include a nested `cast` array) into the
 * domain Movie model. The cast relation is included only when explicitly
 * requested via `include: { cast: true }`.
 */
function toMovieDomain(row: any): Movie {
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
      ? row.cast.map((c: any): CastMember => ({
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

export class MovieRepository implements IMovieRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ── IRepository stubs (not used by partner module) ──────────────────────────

  async get(_id: string): Promise<Movie | null> {
    return null;
  }
  async list(_cond: Partial<Movie>, _paging: PagingDTO): Promise<Movie[]> {
    return [];
  }
  async findByCond(_cond: Partial<Movie>): Promise<Movie | null> {
    return null;
  }

  // ── Queries ─────────────────────────────────────────────────────────────────

  async findById(movieId: string): Promise<Movie | null> {
    const row = await this.prisma.movie.findUnique({
      where: { id: movieId },
      include: { cast: { orderBy: { order: "asc" } } },
    });
    return row ? toMovieDomain(row) : null;
  }

  async findByPartnerId(
    partnerId: string,
    query: ListMoviesQueryDTO,
  ): Promise<{ items: Movie[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      status,
      keyword,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const skip = (page - 1) * limit;
    const where: any = { partnerId };
    if (status) where.status = status;
    if (keyword) where.title = { contains: keyword, mode: "insensitive" };

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

  async findByIdAndPartnerId(movieId: string, partnerId: string): Promise<Movie | null> {
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
  async insert(data: Movie): Promise<boolean> {
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
        status: scalarFields.status as any,
        posterUrl: scalarFields.posterUrl,
        backdropUrl: scalarFields.backdropUrl,
        trailerUrl: scalarFields.trailerUrl,
        altTitle: scalarFields.altTitle,
        director: (scalarFields as any).director,
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

  async update(id: string, data: Partial<Movie>): Promise<boolean> {
    const { cast: _cast, id: _id, partnerId: _pid, ...rest } = data as any;

    await this.prisma.movie.update({
      where: { id },
      data: rest,
    });

    return true;
  }

  async updateStatus(movieId: string, status: string): Promise<boolean> {
    await this.prisma.movie.update({
      where: { id: movieId },
      data: { status: status as any },
    });
    return true;
  }

  async delete(id: string, _isHard = false): Promise<boolean> {
    // Cast rows are deleted automatically via ON DELETE CASCADE
    await this.prisma.movie.delete({ where: { id } });
    return true;
  }

  async findAllForAdmin(
    query: ListMoviesQueryDTO,
  ): Promise<{ items: AdminMovieRow[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      status,
      keyword,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (keyword) where.title = { contains: keyword, mode: "insensitive" };

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

  async getMovieStats(): Promise<AdminMovieStats> {
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
  async replaceCast(movieId: string, cast: CastMember[]): Promise<void> {
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

export const createMovieRepository = (prisma: PrismaClient): IMovieRepository =>
  new MovieRepository(prisma);