import { Router, Request, Response } from "express";
import { PrismaClient, FlagType, FlagEnv } from "@prisma/client";
import { protect, requireRole } from "../../share/middleware/auth";
import { successResponse, errorResponse } from "../../share/transport/http-server";
import { writeAuditLog } from "@/modules/admin-manage/admin-audit-logs/helper";

const adminGuard = [...protect(requireRole("ADMIN"))];

export function buildAdminFeatureFlagsRouter(prisma: PrismaClient): Router {
  const router = Router();
  const paramId = (value: string | string[] | undefined): string =>
    Array.isArray(value) ? value[0] ?? "" : (value ?? "");

  // GET /v1/admin/feature-flags
  router.get("/", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const skip = (page - 1) * limit;
      const env = req.query.env as FlagEnv | undefined;
      const type = req.query.type as FlagType | undefined;
      const search = req.query.search as string | undefined;

      const where: any = {};
      if (env) where.env = env;
      if (type) where.type = type;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { key: { contains: search, mode: "insensitive" } },
        ];
      }

      const [total, items] = await Promise.all([
        prisma.featureFlag.count({ where }),
        prisma.featureFlag.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: "desc" },
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
            updatedBy: { select: { id: true, name: true, email: true } },
          },
        }),
      ]);

      successResponse(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // POST /v1/admin/feature-flags — create
  router.post("/", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const { name, key, description, type, env, rollout, targets, tags } = req.body;

      if (!name || !key || !description || !type || !env) {
        return errorResponse(res, 400, "name, key, description, type, env are required");
      }

      const exists = await prisma.featureFlag.findUnique({ where: { key } });
      if (exists) return errorResponse(res, 409, `Feature flag with key '${key}' already exists`);

      const flag = await prisma.featureFlag.create({
        data: {
          name,
          key,
          description,
          type: type as FlagType,
          env: env as FlagEnv,
          rollout: rollout ?? 0,
          targets: targets ?? [],
          tags: tags ?? [],
          createdById: req.user!.id,
          updatedById: req.user!.id,
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          updatedBy: { select: { id: true, name: true, email: true } },
        },
      });

      successResponse(res, flag, "Feature flag created", 201);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // PATCH /v1/admin/feature-flags/:id — update
  router.patch("/:id", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const { name, description, type, env, rollout, targets, tags, enabled } = req.body;
      const flagId = paramId(req.params.id);

      const existing = await prisma.featureFlag.findUnique({ where: { id: flagId } });
      if (!existing) return errorResponse(res, 404, "Feature flag not found");

      const updated = await prisma.featureFlag.update({
        where: { id: flagId },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(type !== undefined && { type: type as FlagType }),
          ...(env !== undefined && { env: env as FlagEnv }),
          ...(rollout !== undefined && { rollout }),
          ...(targets !== undefined && { targets }),
          ...(tags !== undefined && { tags }),
          ...(enabled !== undefined && { enabled }),
          updatedById: req.user!.id,
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          updatedBy: { select: { id: true, name: true, email: true } },
        },
      });

      if (enabled !== undefined && enabled !== existing.enabled) {
        await writeAuditLog(prisma, req, {
          action: "toggle_feature_flag",
          description: `Set feature flag ${existing.key} to ${enabled ? "enabled" : "disabled"}`,
          category: "system",
          severity: "medium",
          targetType: "feature_flag",
          targetId: existing.id,
          targetLabel: existing.key,
          meta: {
            fromEnabled: existing.enabled,
            toEnabled: enabled,
            env: existing.env,
          },
        });
      }

      successResponse(res, updated);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // PATCH /v1/admin/feature-flags/:id/toggle
  router.patch("/:id/toggle", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const flagId = paramId(req.params.id);
      const existing = await prisma.featureFlag.findUnique({ where: { id: flagId } });
      if (!existing) return errorResponse(res, 404, "Feature flag not found");

      const updated = await prisma.featureFlag.update({
        where: { id: flagId },
        data: { enabled: !existing.enabled, updatedById: req.user!.id },
      });

      await writeAuditLog(prisma, req, {
        action: "toggle_feature_flag",
        description: `${updated.enabled ? "Enabled" : "Disabled"} feature flag ${existing.key}`,
        category: "system",
        severity: "medium",
        targetType: "feature_flag",
        targetId: existing.id,
        targetLabel: existing.key,
        meta: {
          fromEnabled: existing.enabled,
          toEnabled: updated.enabled,
          env: existing.env,
        },
      });

      successResponse(res, updated, `Flag ${updated.enabled ? "enabled" : "disabled"}`);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // POST /v1/admin/feature-flags/emergency-shutdown
  router.post("/emergency-shutdown", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const envInput = String(req.body?.env ?? "PRODUCTION").toUpperCase();
      const allowedEnvs = new Set(["PRODUCTION", "STAGING", "DEVELOPMENT"]);
      if (!allowedEnvs.has(envInput)) {
        return errorResponse(res, 400, "Invalid env value");
      }
      const env = envInput as FlagEnv;

      const activeFlags = await prisma.featureFlag.findMany({
        where: { env, enabled: true },
        select: { id: true, key: true },
      });

      if (activeFlags.length === 0) {
        return successResponse(
          res,
          { env, affected: 0, affectedIds: [], affectedKeys: [] },
          `No active flags found in ${env}`,
        );
      }

      await prisma.$transaction([
        prisma.featureFlag.updateMany({
          where: {
            id: { in: activeFlags.map((flag) => flag.id) },
          },
          data: {
            enabled: false,
            updatedById: req.user!.id,
          },
        }),
      ]);

      await writeAuditLog(prisma, req, {
        action: "emergency_shutdown_feature_flags",
        description: `Emergency shutdown disabled ${activeFlags.length} feature flags in ${env}`,
        category: "system",
        severity: "critical",
        targetType: "feature_flag",
        targetLabel: `${env.toLowerCase()}_kill_switch`,
        meta: {
          env,
          affected: activeFlags.length,
          affectedKeys: activeFlags.map((flag) => flag.key),
        },
      });

      successResponse(res, {
        env,
        affected: activeFlags.length,
        affectedIds: activeFlags.map((flag) => flag.id),
        affectedKeys: activeFlags.map((flag) => flag.key),
      }, `Emergency shutdown applied for ${env}`);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // DELETE /v1/admin/feature-flags/:id
  router.delete("/:id", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const flagId = paramId(req.params.id);
      const existing = await prisma.featureFlag.findUnique({ where: { id: flagId } });
      if (!existing) return errorResponse(res, 404, "Feature flag not found");

      await prisma.featureFlag.delete({ where: { id: flagId } });
      successResponse(res, null, "Feature flag deleted");
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  return router;
}
