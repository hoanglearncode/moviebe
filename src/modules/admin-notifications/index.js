"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdminNotificationsRouter = buildAdminNotificationsRouter;
const express_1 = require("express");
const crypto_1 = require("crypto");
const auth_1 = require("../../share/middleware/auth");
const http_server_1 = require("../../share/transport/http-server");
const broadcast_queue_1 = require("../../queue/config/broadcast.queue");
const logger_1 = require("../system/log/logger");
const helper_1 = require("../admin-audit-logs/helper");
const adminGuard = [...(0, auth_1.protect)((0, auth_1.requireRole)("ADMIN"))];
async function resolveTargetSize(prisma, target) {
    if (target === "ALL")
        return prisma.user.count();
    if (target === "OWNERS")
        return prisma.user.count({ where: { role: "PARTNER" } });
    return prisma.user.count({ where: { role: "USER" } });
}
function buildAdminNotificationsRouter(prisma) {
    const router = (0, express_1.Router)();
    // GET /v1/admin/notifications — list with filter/pagination
    router.get("/", ...adminGuard, async (req, res) => {
        try {
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            const skip = (page - 1) * limit;
            const status = req.query.status;
            const type = req.query.type;
            const where = {};
            if (status)
                where.status = status;
            if (type)
                where.type = type;
            const [total, items] = await Promise.all([
                prisma.broadcastNotification.count({ where }),
                prisma.broadcastNotification.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    include: {
                        createdBy: { select: { id: true, name: true, email: true } },
                    },
                }),
            ]);
            (0, http_server_1.successResponse)(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    // POST /v1/admin/notifications — create (send or schedule or draft)
    router.post("/", ...adminGuard, async (req, res) => {
        try {
            const { title, content, type, target, channel, scheduleMode, scheduledAt } = req.body;
            if (!title || !content || !type || !target) {
                return (0, http_server_1.errorResponse)(res, 400, "title, content, type, target are required");
            }
            const validTypes = ["INFO", "SUCCESS", "WARNING", "ERROR"];
            const validTargets = ["ALL", "USERS", "OWNERS", "VIP", "PREMIUM", "FREE"];
            const validChannels = ["ALL", "WEBSITE", "EMAIL", "DESKTOP", "MOBILE"];
            if (!validTypes.includes(type))
                return (0, http_server_1.errorResponse)(res, 400, `type must be one of: ${validTypes.join(", ")}`);
            if (!validTargets.includes(target))
                return (0, http_server_1.errorResponse)(res, 400, `target must be one of: ${validTargets.join(", ")}`);
            if (channel && !validChannels.includes(channel)) {
                return (0, http_server_1.errorResponse)(res, 400, `channel must be one of: ${validChannels.join(", ")}`);
            }
            const selectedChannel = (channel ?? "ALL");
            const isScheduled = scheduleMode === "later" && scheduledAt;
            const status = isScheduled ? "SCHEDULED" : "SENT";
            const sentAt = isScheduled ? undefined : new Date();
            const totalSent = isScheduled ? 0 : await resolveTargetSize(prisma, target);
            const notification = await prisma.broadcastNotification.create({
                data: {
                    title,
                    content,
                    type: type,
                    target: target,
                    channel: selectedChannel,
                    status,
                    scheduledAt: isScheduled ? new Date(scheduledAt) : undefined,
                    sentAt,
                    totalSent,
                    createdById: req.user.id,
                },
                include: {
                    createdBy: { select: { id: true, name: true, email: true } },
                },
            });
            // Deliver immediately to target users via BullMQ broadcast worker
            if (status === "SENT") {
                await (0, broadcast_queue_1.enqueueBroadcastJob)({
                    broadcastId: notification.id,
                    target,
                    channel: selectedChannel,
                    title,
                    message: content,
                    traceId: (0, crypto_1.randomUUID)(),
                }).catch((err) => {
                    // Non-fatal — broadcast record exists; delivery will be retried manually
                    logger_1.logger.warn("[AdminNotifications] Failed to enqueue broadcast delivery", {
                        broadcastId: notification.id,
                        error: err.message,
                    });
                });
                await (0, helper_1.writeAuditLog)(prisma, req, {
                    action: "send_broadcast_notification",
                    description: `Sent broadcast notification "${title}"`,
                    category: "notification",
                    severity: "medium",
                    targetType: "broadcast_notification",
                    targetId: notification.id,
                    targetLabel: notification.title,
                    meta: {
                        target,
                        channel: selectedChannel,
                        totalSent,
                        type,
                    },
                });
            }
            (0, http_server_1.successResponse)(res, notification, "Notification created", 201);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    // DELETE /v1/admin/notifications/:id
    router.delete("/:id", ...adminGuard, async (req, res) => {
        try {
            const id = req.params.id;
            const existing = await prisma.broadcastNotification.findUnique({
                where: { id },
            });
            if (!existing)
                return (0, http_server_1.errorResponse)(res, 404, "Notification not found");
            await prisma.broadcastNotification.delete({ where: { id } });
            (0, http_server_1.successResponse)(res, null, "Notification deleted");
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    return router;
}
