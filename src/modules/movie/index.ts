import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { MovieRepository } from "./infras/repository/repo";
import { PublicMovieUseCase } from "./usecase/index";
import { PublicMovieHttpService } from "./infras/transport/http-service";

export const buildPublicMovieRouter = (prisma: PrismaClient): Router => {
  const movieRepo = new MovieRepository(prisma);
  const movieUseCase = new PublicMovieUseCase(movieRepo);
  const movieController = new PublicMovieHttpService(movieUseCase);
  const router = Router();
  router.get("/", (req: any, res: any) => movieController.getListMovies(req, res));
  router.get("/:id", (req: any, res: any) => movieController.getMovieDetail(req, res));
  router.get("/:id/showtimes", (req: any, res: any) => movieController.getMovieShowtimes(req, res));
  return router;
};

export const buildPublicShowtimeRouter = (prisma: PrismaClient): Router => {
  const movieRepo = new MovieRepository(prisma);
  const movieUseCase = new PublicMovieUseCase(movieRepo);
  const movieController = new PublicMovieHttpService(movieUseCase);

  const router = Router();
  router.get("/:showtimeId", (req: any, res: any) =>
    movieController.getShowtimeDetail(req, res),
  );
  router.get("/:showtimeId/seats", (req: any, res: any) =>
    movieController.getShowtimeSeatMap(req, res),
  );

  return router;
};

export const setupPublicMovieRoutes = (prisma: PrismaClient) => buildPublicMovieRouter(prisma);
export const setupPublicShowtimeRoutes = (prisma: PrismaClient) => buildPublicShowtimeRouter(prisma);
