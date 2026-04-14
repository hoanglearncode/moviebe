import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { successResponse, errorResponse } from "../../share/transport/http-server";
import { logger } from "../system/log/logger";

/**
 * Public Movie + Showtime + Seat routes (no auth required)
 */
export function setupPublicMovieRoutes(prisma: PrismaClient): Router {
  const router = Router();

  // ── GET /movies ────────────────────────────────────────────────────────────
  router.get("/movies", async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "12"), 10)));
      const skip = (page - 1) * limit;
      const search = req.query.search as string | undefined;
      const genre = req.query.genre as string | undefined;

      const where: any = { status: "ACTIVE" };
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }
      if (genre) where.genre = { contains: genre, mode: "insensitive" };

      const [movies, total] = await Promise.all([
        prisma.movie.findMany({
          where,
          skip,
          take: limit,
          orderBy: { releaseDate: "desc" },
          select: {
            id: true,
            title: true,
            genre: true,
            language: true,
            duration: true,
            releaseDate: true,
            endDate: true,
            posterUrl: true,
            rating: true,
            status: true,
            partner: { select: { cinemaName: true, city: true } },
          },
        }),
        prisma.movie.count({ where }),
      ]);

      successResponse(res, { items: movies, total, page, limit }, "Danh sách phim");
    } catch (err: any) {
      logger.error("[Movie] list error", { error: err.message });
      errorResponse(res, 500, err.message);
    }
  });

  // ── GET /movies/:movieId ───────────────────────────────────────────────────
  router.get("/movies/:movieId", async (req: Request, res: Response) => {
    try {
      const movieId = String(req.params.movieId);
      const movie = await prisma.movie.findUnique({
        where: { id: movieId },
        include: {
          partner: { select: { cinemaName: true, city: true, address: true, logo: true } },
          reviews: {
            where: { status: "APPROVED" },
            orderBy: { createdAt: "desc" },
            take: 10,
            include: { user: { select: { id: true, name: true, avatar: true } } },
          },
          _count: { select: { reviews: true } },
        },
      });

      if (!movie) return errorResponse(res, 404, "Phim không tồn tại");
      successResponse(res, movie, "Chi tiết phim");
    } catch (err: any) {
      logger.error("[Movie] detail error", { error: err.message });
      errorResponse(res, 500, err.message);
    }
  });

  // ── GET /movies/:movieId/showtimes ─────────────────────────────────────────
  router.get("/movies/:movieId/showtimes", async (req: Request, res: Response) => {
    try {
      const movieId = String(req.params.movieId);
      const date = req.query.date as string | undefined;

      const startOfDay = date ? new Date(date) : new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);

      const where: any = {
        movieId,
        status: "SCHEDULED",
        startTime: { gte: new Date() },
      };
      if (date) {
        where.startTime = { gte: startOfDay, lte: endOfDay };
      }

      const showtimes = await prisma.showtime.findMany({
        where,
        orderBy: { startTime: "asc" },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          basePrice: true,
          totalSeats: true,
          availableSeats: true,
          status: true,
          partner: { select: { id: true, cinemaName: true, city: true, address: true } },
        },
      });

      successResponse(res, showtimes, "Danh sách suất chiếu");
    } catch (err: any) {
      logger.error("[Showtime] list error", { error: err.message });
      errorResponse(res, 500, err.message);
    }
  });

  // ── GET /showtimes/:showtimeId/seats ──────────────────────────────────────
  router.get("/showtimes/:showtimeId/seats", async (req: Request, res: Response) => {
    try {
      const showtimeId = String(req.params.showtimeId);

      const showtime = await prisma.showtime.findUnique({
        where: { id: showtimeId },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          basePrice: true,
          totalSeats: true,
          availableSeats: true,
          status: true,
          movie: {
            select: {
              id: true,
              title: true,
              posterUrl: true,
              duration: true,
              genre: true,
            },
          },
          partner: {
            select: { cinemaName: true, city: true, address: true },
          },
        },
      });

      if (!showtime) return errorResponse(res, 404, "Suất chiếu không tồn tại");

      const seats = await prisma.seat.findMany({
        where: { showtimeId },
        orderBy: [{ rowLabel: "asc" }, { columnNumber: "asc" }],
        select: {
          id: true,
          seatNumber: true,
          rowLabel: true,
          columnNumber: true,
          seatType: true,
          status: true,
          price: true,
          lockedUntil: true,
        },
      });

      // Treat expired locks as AVAILABLE
      const now = new Date();
      const seatsNormalized = seats.map((s) => ({
        ...s,
        status:
          s.status === "LOCKED" && s.lockedUntil && s.lockedUntil <= now ? "AVAILABLE" : s.status,
        lockedUntil: undefined,
      }));

      successResponse(res, { showtime, seats: seatsNormalized }, "Sơ đồ ghế");
    } catch (err: any) {
      logger.error("[Seat] map error", { error: err.message });
      errorResponse(res, 500, err.message);
    }
  });

  // ── GET /showtimes/:showtimeId ─────────────────────────────────────────────
  router.get("/showtimes/:showtimeId", async (req: Request, res: Response) => {
    try {
      const showtimeId = String(req.params.showtimeId);
      const showtime = await prisma.showtime.findUnique({
        where: { id: showtimeId },
        include: {
          movie: {
            select: { id: true, title: true, posterUrl: true, duration: true, genre: true, rating: true },
          },
          partner: { select: { cinemaName: true, city: true, address: true } },
        },
      });
      if (!showtime) return errorResponse(res, 404, "Suất chiếu không tồn tại");
      successResponse(res, showtime, "Chi tiết suất chiếu");
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  return router;
}
