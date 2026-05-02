import { PrismaClient } from "@prisma/client";
import { IPublicMovieRepository, MovieSectionsResponse } from "@/modules/movie/interface";
import { Movie, PublicShowtime, PublicShowtimeSeatMap } from "@/modules/movie/model/model";
import { getMovieRepo } from "@/modules/movie/infras/repository/dto";
import { PagingDTO } from "@/share";

export class MovieRepository implements IPublicMovieRepository {
  constructor(private readonly prisma: PrismaClient) {
    getMovieRepo(this.prisma);
  }

  async getListMovies(cond: any, paging: PagingDTO): Promise<MovieSectionsResponse> {
    const { page = 1, limit = 10 } = paging;
    const skip = (page - 1) * limit;
    const now = new Date();

    const baseWhere: any = {
      status: { in: ["APPROVED", "ACTIVE"] },
      ...(cond.search && {
        title: { contains: cond.search, mode: "insensitive" },
      }),
      ...(cond.genres && {
        genre: {
          hasSome: cond.genres.split(",").map((g: string) => g.trim()),
        },
      }),
    };

    const castInclude = {
      cast: {
        select: {
          name: true,
          role: true,
          photo: true,
        },
      },
    };

    const [coming, showing, trend, totalComing, totalShowing] = await Promise.all([
      // 🎬 phim sắp chiếu
      this.prisma.movie.findMany({
        where: {
          ...baseWhere,
          releaseDate: { gt: now },
        },
        include: castInclude,
        skip,
        take: limit,
        orderBy: { releaseDate: "asc" },
      }),

      // 🎬 phim đang chiếu
      this.prisma.movie.findMany({
        where: {
          ...baseWhere,
          releaseDate: { lte: now },
          endDate: { gte: now },
        },
        include: castInclude,
        skip,
        take: limit,
        orderBy: { releaseDate: "desc" },
      }),

      // 🔥 trending
      this.prisma.movie.findMany({
        where: baseWhere,
        include: castInclude,
        orderBy: {
          tickets: { _count: "desc" },
        },
        take: 4,
      }),

      // 📊 count coming
      this.prisma.movie.count({
        where: {
          ...baseWhere,
          releaseDate: { gt: now },
        },
      }),

      // 📊 count showing
      this.prisma.movie.count({
        where: {
          ...baseWhere,
          releaseDate: { lte: now },
          endDate: { gte: now },
        },
      }),
    ]);

    return {
      coming,
      showing,
      trend,
      pagination: {
        page,
        limit,
        totalComing,
        totalShowing,
        totalPagesComing: Math.ceil(totalComing / limit),
        totalPagesShowing: Math.ceil(totalShowing / limit),
      },
    };
  }

  async getMovieById(id: string): Promise<Movie | null> {
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

    return movie as unknown as Movie | null;
  }

  async getMovieShowtimes(movieId: string, date?: string): Promise<PublicShowtime[]> {
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

    return rows as unknown as PublicShowtime[];
  }

  async getShowtimeById(showtimeId: string): Promise<PublicShowtime | null> {
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

    return row ? (row as unknown as PublicShowtime) : null;
  }

  async getShowtimeSeatMap(showtimeId: string): Promise<PublicShowtimeSeatMap | null> {
    const showtime = await this.getShowtimeById(showtimeId);
    if (!showtime) return null;

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
            layoutSeat: room.layoutSeat as number[][],
            rows: room.rows,
            seatsPerRow: room.seatsPerRow,
          }
        : null,
      seats: seats as unknown as any[],
    };
  }
}
