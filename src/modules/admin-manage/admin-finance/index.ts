import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { protect, requireRole } from "@/share/middleware/auth";
import { successResponse, errorResponse } from "@/share/transport/http-server";
import { AdminFinanceUseCase } from "@/modules/admin-manage/admin-finance/usecase";
import { writeAuditLog } from "@/modules/admin-manage/admin-audit-logs/helper";

const adminGuard = [...protect(requireRole("ADMIN"))];

export function buildAdminFinanceRouter(prisma: PrismaClient): Router {
  const router = Router();
  const useCase = new AdminFinanceUseCase(prisma);
  const paramId = (value: string | string[] | undefined): string =>
    Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

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
      const withdrawalId = paramId(req.params.id);
      const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
      const data = await useCase.approveWithdrawal(withdrawalId, req.user!.id);
      await writeAuditLog(prisma, req, {
        action: "approve_withdrawal",
        description: `Approved withdrawal ${withdrawalId}`,
        category: "finance",
        severity: "high",
        targetType: "withdrawal",
        targetId: withdrawalId,
        targetLabel: withdrawalId,
        meta: {
          partnerId: withdrawal?.partnerId,
          amount: withdrawal?.amount,
          statusTo: "PROCESSING",
        },
      });
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 400, err.message);
    }
  });

  router.patch("/withdrawals/:id/complete", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const withdrawalId = paramId(req.params.id);
      const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
      const data = await useCase.completeWithdrawal(withdrawalId, req.body.transactionReference);
      await writeAuditLog(prisma, req, {
        action: "complete_withdrawal",
        description: `Completed withdrawal ${withdrawalId}`,
        category: "finance",
        severity: "high",
        targetType: "withdrawal",
        targetId: withdrawalId,
        targetLabel: withdrawalId,
        meta: {
          partnerId: withdrawal?.partnerId,
          amount: withdrawal?.amount,
          transactionReference: req.body.transactionReference ?? "",
          statusTo: "COMPLETED",
        },
      });
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, 400, err.message);
    }
  });

  router.patch("/withdrawals/:id/reject", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      if (!reason) return errorResponse(res, 400, "Rejection reason is required");
      const withdrawalId = paramId(req.params.id);
      const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
      const data = await useCase.rejectWithdrawal(withdrawalId, reason);
      await writeAuditLog(prisma, req, {
        action: "reject_withdrawal",
        description: `Rejected withdrawal ${withdrawalId}`,
        category: "finance",
        severity: "high",
        targetType: "withdrawal",
        targetId: withdrawalId,
        targetLabel: withdrawalId,
        meta: {
          partnerId: withdrawal?.partnerId,
          amount: withdrawal?.amount,
          reason,
          statusTo: "FAILED",
        },
      });
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
