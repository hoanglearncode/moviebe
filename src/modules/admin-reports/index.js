"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdminReportsRouter = buildAdminReportsRouter;
const express_1 = require("express");
const auth_1 = require("../../share/middleware/auth");
const http_server_1 = require("../../share/transport/http-server");
const helper_1 = require("../admin-audit-logs/helper");
const adminGuard = [...(0, auth_1.protect)((0, auth_1.requireRole)("ADMIN"))];
function buildAdminReportsRouter(prisma) {
    const router = (0, express_1.Router)();
    const paramId = (value) => Array.isArray(value) ? value[0] ?? "" : (value ?? "");
    // GET /v1/admin/reports — list with filter/pagination
    router.get("/", ...adminGuard, async (req, res) => {
        try {
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            const skip = (page - 1) * limit;
            const status = req.query.status;
            const target = req.query.target;
            const priority = req.query.priority;
            const where = {};
            if (status)
                where.status = status;
            if (target)
                where.target = target;
            if (priority)
                where.priority = priority;
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
            (0, http_server_1.successResponse)(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    // PATCH /v1/admin/reports/:id/resolve
    router.patch("/:id/resolve", ...adminGuard, async (req, res) => {
        try {
            const { action, adminNote } = req.body;
            const reportId = paramId(req.params.id);
            const validActions = [
                "NONE", "WARN_USER", "DELETE_CONTENT", "BAN_USER", "BAN_OWNER", "FLAG_CONTENT", "ESCALATE",
            ];
            if (action && !validActions.includes(action)) {
                return (0, http_server_1.errorResponse)(res, 400, `action must be one of: ${validActions.join(", ")}`);
            }
            const existing = await prisma.report.findUnique({ where: { id: reportId } });
            if (!existing)
                return (0, http_server_1.errorResponse)(res, 404, "Report not found");
            const updated = await prisma.report.update({
                where: { id: reportId },
                data: {
                    status: "RESOLVED",
                    actionTaken: action ?? "NONE",
                    adminNote: adminNote ?? null,
                    resolvedById: req.user.id,
                    resolvedAt: new Date(),
                },
                include: {
                    reportedBy: { select: { id: true, name: true, email: true, avatar: true } },
                    resolvedBy: { select: { id: true, name: true, email: true } },
                },
            });
            await (0, helper_1.writeAuditLog)(prisma, req, {
                action: "resolve_report_content",
                description: `Resolved report ${reportId}`,
                category: "moderation",
                severity: "medium",
                targetType: "report",
                targetId: updated.id,
                targetLabel: `${updated.target}:${updated.targetId}`,
                meta: {
                    actionTaken: updated.actionTaken,
                    status: updated.status,
                },
            });
            (0, http_server_1.successResponse)(res, updated, "Report resolved");
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    // PATCH /v1/admin/reports/:id/dismiss
    router.patch("/:id/dismiss", ...adminGuard, async (req, res) => {
        try {
            const { adminNote } = req.body;
            const reportId = paramId(req.params.id);
            const existing = await prisma.report.findUnique({ where: { id: reportId } });
            if (!existing)
                return (0, http_server_1.errorResponse)(res, 404, "Report not found");
            const updated = await prisma.report.update({
                where: { id: reportId },
                data: {
                    status: "DISMISSED",
                    actionTaken: "NONE",
                    adminNote: adminNote ?? null,
                    resolvedById: req.user.id,
                    resolvedAt: new Date(),
                },
                include: {
                    reportedBy: { select: { id: true, name: true, email: true, avatar: true } },
                    resolvedBy: { select: { id: true, name: true, email: true } },
                },
            });
            await (0, helper_1.writeAuditLog)(prisma, req, {
                action: "dismiss_report_content",
                description: `Dismissed report ${reportId}`,
                category: "moderation",
                severity: "low",
                targetType: "report",
                targetId: updated.id,
                targetLabel: `${updated.target}:${updated.targetId}`,
                meta: {
                    status: updated.status,
                },
            });
            (0, http_server_1.successResponse)(res, updated, "Report dismissed");
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    // PATCH /v1/admin/reports/:id/status — generic status update
    router.patch("/:id/status", ...adminGuard, async (req, res) => {
        try {
            const { status } = req.body;
            const reportId = paramId(req.params.id);
            const validStatuses = ["PENDING", "REVIEWING", "RESOLVED", "DISMISSED"];
            if (!status || !validStatuses.includes(status)) {
                return (0, http_server_1.errorResponse)(res, 400, `status must be one of: ${validStatuses.join(", ")}`);
            }
            const existing = await prisma.report.findUnique({ where: { id: reportId } });
            if (!existing)
                return (0, http_server_1.errorResponse)(res, 404, "Report not found");
            const updated = await prisma.report.update({
                where: { id: reportId },
                data: { status: status },
            });
            (0, http_server_1.successResponse)(res, updated);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    return router;
}
