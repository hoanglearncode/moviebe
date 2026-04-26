"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdminFeatureFlagsRouter = buildAdminFeatureFlagsRouter;
const express_1 = require("express");
const auth_1 = require("../../share/middleware/auth");
const http_server_1 = require("../../share/transport/http-server");
const helper_1 = require("../admin-audit-logs/helper");
const adminGuard = [...(0, auth_1.protect)((0, auth_1.requireRole)("ADMIN"))];
function buildAdminFeatureFlagsRouter(prisma) {
    const router = (0, express_1.Router)();
    const paramId = (value) => Array.isArray(value) ? value[0] ?? "" : (value ?? "");
    // GET /v1/admin/feature-flags
    router.get("/", ...adminGuard, async (req, res) => {
        try {
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 50;
            const skip = (page - 1) * limit;
            const env = req.query.env;
            const type = req.query.type;
            const search = req.query.search;
            const where = {};
            if (env)
                where.env = env;
            if (type)
                where.type = type;
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
            (0, http_server_1.successResponse)(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    // POST /v1/admin/feature-flags — create
    router.post("/", ...adminGuard, async (req, res) => {
        try {
            const { name, key, description, type, env, rollout, targets, tags } = req.body;
            if (!name || !key || !description || !type || !env) {
                return (0, http_server_1.errorResponse)(res, 400, "name, key, description, type, env are required");
            }
            const exists = await prisma.featureFlag.findUnique({ where: { key } });
            if (exists)
                return (0, http_server_1.errorResponse)(res, 409, `Feature flag with key '${key}' already exists`);
            const flag = await prisma.featureFlag.create({
                data: {
                    name,
                    key,
                    description,
                    type: type,
                    env: env,
                    rollout: rollout ?? 0,
                    targets: targets ?? [],
                    tags: tags ?? [],
                    createdById: req.user.id,
                    updatedById: req.user.id,
                },
                include: {
                    createdBy: { select: { id: true, name: true, email: true } },
                    updatedBy: { select: { id: true, name: true, email: true } },
                },
            });
            (0, http_server_1.successResponse)(res, flag, "Feature flag created", 201);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    // PATCH /v1/admin/feature-flags/:id — update
    router.patch("/:id", ...adminGuard, async (req, res) => {
        try {
            const { name, description, type, env, rollout, targets, tags, enabled } = req.body;
            const flagId = paramId(req.params.id);
            const existing = await prisma.featureFlag.findUnique({ where: { id: flagId } });
            if (!existing)
                return (0, http_server_1.errorResponse)(res, 404, "Feature flag not found");
            const updated = await prisma.featureFlag.update({
                where: { id: flagId },
                data: {
                    ...(name !== undefined && { name }),
                    ...(description !== undefined && { description }),
                    ...(type !== undefined && { type: type }),
                    ...(env !== undefined && { env: env }),
                    ...(rollout !== undefined && { rollout }),
                    ...(targets !== undefined && { targets }),
                    ...(tags !== undefined && { tags }),
                    ...(enabled !== undefined && { enabled }),
                    updatedById: req.user.id,
                },
                include: {
                    createdBy: { select: { id: true, name: true, email: true } },
                    updatedBy: { select: { id: true, name: true, email: true } },
                },
            });
            if (enabled !== undefined && enabled !== existing.enabled) {
                await (0, helper_1.writeAuditLog)(prisma, req, {
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
            (0, http_server_1.successResponse)(res, updated);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    // PATCH /v1/admin/feature-flags/:id/toggle
    router.patch("/:id/toggle", ...adminGuard, async (req, res) => {
        try {
            const flagId = paramId(req.params.id);
            const existing = await prisma.featureFlag.findUnique({ where: { id: flagId } });
            if (!existing)
                return (0, http_server_1.errorResponse)(res, 404, "Feature flag not found");
            const updated = await prisma.featureFlag.update({
                where: { id: flagId },
                data: { enabled: !existing.enabled, updatedById: req.user.id },
            });
            await (0, helper_1.writeAuditLog)(prisma, req, {
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
            (0, http_server_1.successResponse)(res, updated, `Flag ${updated.enabled ? "enabled" : "disabled"}`);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    // DELETE /v1/admin/feature-flags/:id
    router.delete("/:id", ...adminGuard, async (req, res) => {
        try {
            const flagId = paramId(req.params.id);
            const existing = await prisma.featureFlag.findUnique({ where: { id: flagId } });
            if (!existing)
                return (0, http_server_1.errorResponse)(res, 404, "Feature flag not found");
            await prisma.featureFlag.delete({ where: { id: flagId } });
            (0, http_server_1.successResponse)(res, null, "Feature flag deleted");
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    return router;
}
