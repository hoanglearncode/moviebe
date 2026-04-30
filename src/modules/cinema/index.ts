import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { successResponse, errorResponse } from "@/share/transport/http-server";
import { CinemaUseCase } from "@/modules/cinema/usecase";

export function buildCinemaRouter(prisma: PrismaClient): Router {
  const router = Router();
  const useCase = new CinemaUseCase(prisma);

  router.get("/", async (req: Request, res: Response) => {
    try {
      const data = await useCase.list({
        city: req.query.city as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      });
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  router.get("/cities", async (req: Request, res: Response) => {
    try {
      const data = await useCase.getCities();
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const data = await useCase.getDetail(req.params.id);
      if (!data) return errorResponse(res, 404, "Cinema not found");
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  return router;
}
