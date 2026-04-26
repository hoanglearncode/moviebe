"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdminPlansRouter = buildAdminPlansRouter;
const express_1 = require("express");
const auth_1 = require("../../share/middleware/auth");
const http_server_1 = require("../../share/transport/http-server");
const adminGuard = [...(0, auth_1.protect)((0, auth_1.requireRole)("ADMIN"))];
function buildAdminPlansRouter(prisma) {
    const router = (0, express_1.Router)();
    // GET /v1/admin/plans
    router.get("/", ...adminGuard, async (req, res) => {
        try {
            const items = await prisma.plan.findMany({ orderBy: { price: "asc" } });
            (0, http_server_1.successResponse)(res, { items, total: items.length });
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    // POST /v1/admin/plans
    router.post("/", ...adminGuard, async (req, res) => {
        try {
            const { name, slug, price, yearlyPrice, description, maxDevices, quality, isActive, isPopular, color, icon, features } = req.body;
            if (!name || !slug || price === undefined || !description) {
                return (0, http_server_1.errorResponse)(res, 400, "name, slug, price, description are required");
            }
            const exists = await prisma.plan.findUnique({ where: { slug } });
            if (exists)
                return (0, http_server_1.errorResponse)(res, 409, `Plan with slug '${slug}' already exists`);
            const plan = await prisma.plan.create({
                data: {
                    name,
                    slug,
                    price,
                    yearlyPrice: yearlyPrice ?? null,
                    description,
                    maxDevices: maxDevices ?? 1,
                    quality: quality ?? "HD",
                    isActive: isActive ?? true,
                    isPopular: isPopular ?? false,
                    color: color ?? "zinc",
                    icon: icon ?? "star",
                    features: features ?? [],
                },
            });
            (0, http_server_1.successResponse)(res, plan, "Plan created", 201);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    // PATCH /v1/admin/plans/:id
    router.patch("/:id", ...adminGuard, async (req, res) => {
        try {
            const existing = await prisma.plan.findUnique({ where: { id: req.params.id } });
            if (!existing)
                return (0, http_server_1.errorResponse)(res, 404, "Plan not found");
            const { name, slug, price, yearlyPrice, description, maxDevices, quality, isActive, isPopular, color, icon, features } = req.body;
            if (slug && slug !== existing.slug) {
                const conflict = await prisma.plan.findUnique({ where: { slug } });
                if (conflict)
                    return (0, http_server_1.errorResponse)(res, 409, `Plan with slug '${slug}' already exists`);
            }
            const updated = await prisma.plan.update({
                where: { id: req.params.id },
                data: {
                    ...(name !== undefined && { name }),
                    ...(slug !== undefined && { slug }),
                    ...(price !== undefined && { price }),
                    ...(yearlyPrice !== undefined && { yearlyPrice }),
                    ...(description !== undefined && { description }),
                    ...(maxDevices !== undefined && { maxDevices }),
                    ...(quality !== undefined && { quality }),
                    ...(isActive !== undefined && { isActive }),
                    ...(isPopular !== undefined && { isPopular }),
                    ...(color !== undefined && { color }),
                    ...(icon !== undefined && { icon }),
                    ...(features !== undefined && { features }),
                },
            });
            (0, http_server_1.successResponse)(res, updated);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    // PATCH /v1/admin/plans/:id/toggle
    router.patch("/:id/toggle", ...adminGuard, async (req, res) => {
        try {
            const existing = await prisma.plan.findUnique({ where: { id: req.params.id } });
            if (!existing)
                return (0, http_server_1.errorResponse)(res, 404, "Plan not found");
            const updated = await prisma.plan.update({
                where: { id: req.params.id },
                data: { isActive: !existing.isActive },
            });
            (0, http_server_1.successResponse)(res, updated, `Plan ${updated.isActive ? "activated" : "deactivated"}`);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    // DELETE /v1/admin/plans/:id
    router.delete("/:id", ...adminGuard, async (req, res) => {
        try {
            const existing = await prisma.plan.findUnique({ where: { id: req.params.id } });
            if (!existing)
                return (0, http_server_1.errorResponse)(res, 404, "Plan not found");
            await prisma.plan.delete({ where: { id: req.params.id } });
            (0, http_server_1.successResponse)(res, null, "Plan deleted");
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    return router;
}
