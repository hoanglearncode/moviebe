import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { protect, requireRole } from "@/share/middleware/auth";
import { successResponse, errorResponse } from "@/share/transport/http-server";

const adminGuard = [...protect(requireRole("ADMIN"))];

export function buildAdminAuditLogsRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get("/", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const skip = (page - 1) * limit;
      const category = req.query.category as string | undefined;
      const severity = req.query.severity as string | undefined;
      const search = req.query.search as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const where: any = {};
      if (category) where.category = category;
      if (severity) where.severity = severity;
      if (search) {
        where.OR = [
          { action: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { actorEmail: { contains: search, mode: "insensitive" } },
        ];
      }
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
      }

      const [total, items] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      successResponse(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  return router;
}

// Utility to create audit log entries from other modules
export async function createAuditLog(
  prisma: PrismaClient,
  entry: {
    action: string;
    description: string;
    category: string;
    severity: string;
    actorId?: string;
    actorEmail: string;
    actorRole?: string;
    targetType?: string;
    targetLabel?: string;
    targetId?: string;
    meta?: Record<string, string>;
    ip?: string;
    device?: string;
    location?: string;
  },
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: entry.action,
      description: entry.description,
      category: entry.category,
      severity: entry.severity,
      actorId: entry.actorId,
      actorEmail: entry.actorEmail,
      actorRole: entry.actorRole ?? "admin",
      targetType: entry.targetType,
      targetLabel: entry.targetLabel,
      targetId: entry.targetId,
      meta: entry.meta ?? {},
      ip: entry.ip ?? "",
      device: entry.device ?? "desktop",
      location: entry.location ?? "",
    },
  });
}
