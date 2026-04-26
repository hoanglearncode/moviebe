"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeBroadcastWorker = exports.startBroadcastWorker = void 0;
const bullmq_1 = require("bullmq");
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const prisma_1 = require("../../share/component/prisma");
const logger_1 = require("../../modules/system/log/logger");
const config_1 = require("../config/config");
const types_1 = require("../modules/types");
const email_queue_1 = require("../config/email.queue");
const notification_queue_1 = require("../config/notification.queue");
let broadcastWorker = null;
const BATCH_SIZE = 100;
const buildUserWhere = (target) => {
    if (target === client_1.BroadcastTarget.ALL)
        return {};
    if (target === client_1.BroadcastTarget.OWNERS)
        return { role: client_1.Role.PARTNER };
    return { role: client_1.Role.USER };
};
const processBroadcastJob = async (job) => {
    const { broadcastId, target, channel, title, message } = job.data;
    const userWhere = buildUserWhere(target);
    const shouldPushWebsite = channel === client_1.BroadcastChannel.ALL ||
        channel === client_1.BroadcastChannel.WEBSITE ||
        channel === client_1.BroadcastChannel.DESKTOP ||
        channel === client_1.BroadcastChannel.MOBILE;
    const shouldSendEmail = channel === client_1.BroadcastChannel.ALL || channel === client_1.BroadcastChannel.EMAIL;
    let cursor;
    let totalSent = 0;
    logger_1.logger.info("[BroadcastWorker] Starting delivery", { broadcastId, target, channel });
    while (true) {
        const users = await prisma_1.prisma.user.findMany({
            where: userWhere,
            select: { id: true, email: true },
            take: BATCH_SIZE,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            orderBy: { id: "asc" },
        });
        if (users.length === 0)
            break;
        if (shouldPushWebsite) {
            const notifications = users.map((u) => ({
                id: (0, crypto_1.randomUUID)(),
                userId: u.id,
                type: client_1.NotificationType.SYSTEM,
                title,
                message,
                data: { broadcastId },
                isRead: false,
            }));
            await prisma_1.prisma.notification.createMany({ data: notifications });
            await Promise.all(notifications.map((n) => (0, notification_queue_1.enqueueNotificationJob)({
                notificationId: n.id,
                userId: n.userId,
                type: n.type,
                title: n.title,
                message: n.message,
                data: { broadcastId },
                traceId: (0, crypto_1.randomUUID)(),
            }).catch((err) => {
                logger_1.logger.warn("[BroadcastWorker] Enqueue push failed for user", {
                    userId: n.userId,
                    error: err.message,
                });
            })));
        }
        if (shouldSendEmail) {
            await Promise.all(users.map((u) => (0, email_queue_1.enqueueEmailJob)({
                to: u.email,
                subject: title,
                html: `<p>${message}</p>`,
                text: message.replace(/<[^>]+>/g, ""),
                traceId: (0, crypto_1.randomUUID)(),
            }).catch((err) => {
                logger_1.logger.warn("[BroadcastWorker] Enqueue email failed for user", {
                    userId: u.id,
                    error: err.message,
                });
            })));
        }
        totalSent += users.length;
        cursor = users[users.length - 1].id;
        logger_1.logger.debug("[BroadcastWorker] Batch delivered", {
            broadcastId,
            batchSize: users.length,
            totalSent,
        });
    }
    await prisma_1.prisma.broadcastNotification.update({
        where: { id: broadcastId },
        data: { totalSent, sentAt: new Date() },
    });
    logger_1.logger.info("[BroadcastWorker] Delivery complete", { broadcastId, totalSent });
};
const startBroadcastWorker = () => {
    if (!config_1.isQueueEnabled || !config_1.areQueueWorkersEnabled) {
        logger_1.logger.info("[BroadcastWorker] Disabled");
        return null;
    }
    if (broadcastWorker)
        return broadcastWorker;
    broadcastWorker = new bullmq_1.Worker(types_1.QueueName.Broadcast, processBroadcastJob, {
        connection: (0, config_1.createRedisConnection)(),
        prefix: config_1.queuePrefix,
        concurrency: 1,
    });
    broadcastWorker.on("ready", () => logger_1.logger.info("[BroadcastWorker] Ready"));
    broadcastWorker.on("completed", (job) => logger_1.logger.info("[BroadcastWorker] Completed", { jobId: job.id }));
    broadcastWorker.on("failed", (job, err) => logger_1.logger.error("[BroadcastWorker] Failed", { jobId: job?.id, error: err.message }));
    broadcastWorker.on("error", (err) => logger_1.logger.error("[BroadcastWorker] Error", { error: err.message }));
    return broadcastWorker;
};
exports.startBroadcastWorker = startBroadcastWorker;
const closeBroadcastWorker = async () => {
    if (!broadcastWorker)
        return;
    await broadcastWorker.close();
    broadcastWorker = null;
};
exports.closeBroadcastWorker = closeBroadcastWorker;
