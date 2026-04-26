import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { protect, requireRole } from "../../share/middleware/auth";
import { successResponse, errorResponse } from "../../share/transport/http-server";
import { AdminFinanceUseCase } from "./usecase";

const adminGuard = [...protect(requireRole("ADMIN"))];

export function buildAdminFinanceRouter(prisma: PrismaClient): Router {
  const router = Router();
  const useCase = new AdminFinanceUseCase(prisma);

  router.get("/summary", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as string) || "12m";
      const data = await useCase.getSummary(period as any);
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  router.get("/revenue-trend", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as string) || "12m";
      const data = await useCase.getRevenueTrend(period as any);
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  router.get("/transactions", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const data = await useCase.getTransactions({
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        type: req.query.type as string,
        status: req.query.status as string,
        partnerId: req.query.partnerId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  router.get("/withdrawals", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const data = await useCase.getWithdrawals({
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        status: req.query.status as string,
        partnerId: req.query.partnerId as string,
      });
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  router.patch("/withdrawals/:id/approve", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const data = await useCase.approveWithdrawal(req.params.id, req.user!.id);
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 400, err.message);
    }
  });

  router.patch("/withdrawals/:id/complete", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const data = await useCase.completeWithdrawal(
        req.params.id,
        req.body.transactionReference,
      );
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 400, err.message);
    }
  });

  router.patch("/withdrawals/:id/reject", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      if (!reason) return errorResponse(res, 400, "Rejection reason is required");
      const data = await useCase.rejectWithdrawal(req.params.id, reason);
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 400, err.message);
    }
  });

  router.get("/plan-distribution", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const data = await useCase.getPlanDistribution();
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  return router;
}
