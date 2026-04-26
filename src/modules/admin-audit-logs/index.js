"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdminAuditLogsRouter = buildAdminAuditLogsRouter;
exports.createAuditLog = createAuditLog;
const express_1 = require("express");
const auth_1 = require("../../share/middleware/auth");
const http_server_1 = require("../../share/transport/http-server");
const adminGuard = [...(0, auth_1.protect)((0, auth_1.requireRole)("ADMIN"))];
function buildAdminAuditLogsRouter(prisma) {
    const router = (0, express_1.Router)();
    // GET /v1/admin/audit-logs — paginated, filterable
    router.get("/", ...adminGuard, async (req, res) => {
        try {
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 50;
            const skip = (page - 1) * limit;
            const category = req.query.category;
            const severity = req.query.severity;
            const search = req.query.search;
            const from = req.query.from;
            const to = req.query.to;
            const where = {};
            if (category)
                where.category = category;
            if (severity)
                where.severity = severity;
            if (search) {
                where.OR = [
                    { action: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                    { actorEmail: { contains: search, mode: "insensitive" } },
                ];
            }
            if (from || to) {
                where.createdAt = {};
                if (from)
                    where.createdAt.gte = new Date(from);
                if (to)
                    where.createdAt.lte = new Date(to);
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
            (0, http_server_1.successResponse)(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    return router;
}
// Utility to create audit log entries from other modules
async function createAuditLog(prisma, entry) {
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
