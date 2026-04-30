import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { protect, requireRole } from "../../share/middleware/auth";
import { successResponse, errorResponse } from "../../share/transport/http-server";
import { AdminAnalyticsUseCase } from "@/modules/admin-manage/admin-analytics/usecase";

const adminGuard = [...protect(requireRole("ADMIN"))];

export function buildAdminAnalyticsRouter(prisma: PrismaClient): Router {
  const router = Router();
  const useCase = new AdminAnalyticsUseCase(prisma);

  router.get("/overview", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const data = await useCase.getOverview();
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  router.get("/revenue", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as string) || "30d";
      const validPeriods = ["7d", "30d", "90d", "1y"];
      if (!validPeriods.includes(period)) {
        return errorResponse(res, 400, "Invalid period. Use: 7d, 30d, 90d, 1y");
      }
      const data = await useCase.getRevenueTrend(period as any);
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  router.get("/users", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as string) || "30d";
      const validPeriods = ["7d", "30d", "90d", "1y"];
      if (!validPeriods.includes(period)) {
        return errorResponse(res, 400, "Invalid period. Use: 7d, 30d, 90d, 1y");
      }
      const data = await useCase.getUserTrend(period as any);
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  router.get("/content", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const data = await useCase.getContentStats();
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  router.get("/health", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const data = await useCase.getSystemHealth();
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  return router;
}
