"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeNotificationWorker = exports.startNotificationWorker = void 0;
const bullmq_1 = require("bullmq");
const logger_1 = require("../../modules/system/log/logger");
const prisma_1 = require("../../share/component/prisma");
const services_1 = require("../../socket/services");
const config_1 = require("../config/config");
const types_1 = require("../modules/types");
let notificationWorker = null;
const processNotificationJob = async (job) => {
    const { notificationId, userId, type, title, message, data } = job.data;
    // 1. Push real-time event via Pusher to the user's private channel
    await services_1.PusherService.trigger(`private-user-${userId}`, "notification.new", {
        id: notificationId,
        type,
        title,
        message,
        data: data ?? {},
        createdAt: new Date().toISOString(),
    });
    // 2. Mark the DB record as delivered (optional field; skipped if column not present)
    try {
        await prisma_1.prisma.notification.update({
            where: { id: notificationId },
            data: { deliveredAt: new Date() },
        });
    }
    catch {
        // deliveredAt column is optional — ignore if not migrated yet
    }
    logger_1.logger.info("[NotificationWorker] Pushed", {
        jobId: job.id,
        userId,
        type,
        traceId: job.data.traceId,
    });
};
const startNotificationWorker = () => {
    if (!config_1.isQueueEnabled || !config_1.areQueueWorkersEnabled) {
        logger_1.logger.info("[NotificationWorker] Disabled", {
            queueEnabled: config_1.isQueueEnabled,
            workersEnabled: config_1.areQueueWorkersEnabled,
        });
        return null;
    }
    if (notificationWorker)
        return notificationWorker;
    notificationWorker = new bullmq_1.Worker(types_1.QueueName.Notification, processNotificationJob, {
        connection: (0, config_1.createRedisConnection)(),
        prefix: config_1.queuePrefix,
        concurrency: 10,
    });
    notificationWorker.on("ready", () => logger_1.logger.info("[NotificationWorker] Ready"));
    notificationWorker.on("completed", (job) => logger_1.logger.debug("[NotificationWorker] Completed", { jobId: job.id }));
    notificationWorker.on("failed", (job, err) => logger_1.logger.error("[NotificationWorker] Failed", { jobId: job?.id, error: err.message }));
    notificationWorker.on("error", (err) => logger_1.logger.error("[NotificationWorker] Error", { error: err.message }));
    return notificationWorker;
};
exports.startNotificationWorker = startNotificationWorker;
const closeNotificationWorker = async () => {
    if (!notificationWorker)
        return;
    await notificationWorker.close();
    notificationWorker = null;
};
exports.closeNotificationWorker = closeNotificationWorker;
