import { Router, Request, Response } from "express";
import { PrismaClient, ReportStatus, ReportAction } from "@prisma/client";
import { protect, requireRole } from "../../share/middleware/auth";
import { successResponse, errorResponse } from "../../share/transport/http-server";

const adminGuard = [...protect(requireRole("ADMIN"))];

export function buildAdminReportsRouter(prisma: PrismaClient): Router {
  const router = Router();

  // GET /v1/admin/reports — list with filter/pagination
  router.get("/", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const skip = (page - 1) * limit;
      const status = req.query.status as ReportStatus | undefined;
      const target = req.query.target as string | undefined;
      const priority = req.query.priority as string | undefined;

      const where: any = {};
      if (status) where.status = status;
      if (target) where.target = target;
      if (priority) where.priority = priority;

      const [total, items] = await Promise.all([
        prisma.report.count({ where }),
        prisma.report.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            reportedBy: { select: { id: true, name: true, email: true, avatar: true } },
            resolvedBy: { select: { id: true, name: true, email: true } },
          },
        }),
      ]);

      successResponse(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // PATCH /v1/admin/reports/:id/resolve
  router.patch("/:id/resolve", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const { action, adminNote } = req.body;

      const validActions: ReportAction[] = [
        "NONE", "WARN_USER", "DELETE_CONTENT", "BAN_USER", "BAN_OWNER", "FLAG_CONTENT", "ESCALATE",
      ];
      if (action && !validActions.includes(action)) {
        return errorResponse(res, 400, `action must be one of: ${validActions.join(", ")}`);
      }

      const existing = await prisma.report.findUnique({ where: { id: req.params.id } });
      if (!existing) return errorResponse(res, 404, "Report not found");

      const updated = await prisma.report.update({
        where: { id: req.params.id },
        data: {
          status: "RESOLVED",
          actionTaken: (action as ReportAction) ?? "NONE",
          adminNote: adminNote ?? null,
          resolvedById: req.user!.id,
          resolvedAt: new Date(),
        },
        include: {
          reportedBy: { select: { id: true, name: true, email: true, avatar: true } },
          resolvedBy: { select: { id: true, name: true, email: true } },
        },
      });

      successResponse(res, updated, "Report resolved");
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // PATCH /v1/admin/reports/:id/dismiss
  router.patch("/:id/dismiss", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const { adminNote } = req.body;

      const existing = await prisma.report.findUnique({ where: { id: req.params.id } });
      if (!existing) return errorResponse(res, 404, "Report not found");

      const updated = await prisma.report.update({
        where: { id: req.params.id },
        data: {
          status: "DISMISSED",
          actionTaken: "NONE",
          adminNote: adminNote ?? null,
          resolvedById: req.user!.id,
          resolvedAt: new Date(),
        },
        include: {
          reportedBy: { select: { id: true, name: true, email: true, avatar: true } },
          resolvedBy: { select: { id: true, name: true, email: true } },
        },
      });

      successResponse(res, updated, "Report dismissed");
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // PATCH /v1/admin/reports/:id/status — generic status update
  router.patch("/:id/status", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const validStatuses: ReportStatus[] = ["PENDING", "REVIEWING", "RESOLVED", "DISMISSED"];
      if (!status || !validStatuses.includes(status)) {
        return errorResponse(res, 400, `status must be one of: ${validStatuses.join(", ")}`);
      }

      const existing = await prisma.report.findUnique({ where: { id: req.params.id } });
      if (!existing) return errorResponse(res, 404, "Report not found");

      const updated = await prisma.report.update({
        where: { id: req.params.id },
        data: { status: status as ReportStatus },
      });

      successResponse(res, updated);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  return router;
}
