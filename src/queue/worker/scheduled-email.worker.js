"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeScheduledEmailWorker = exports.startScheduledEmailWorker = void 0;
const bullmq_1 = require("bullmq");
const prisma_1 = require("../../share/component/prisma");
const logger_1 = require("../../modules/system/log/logger");
const mail_1 = require("../../share/component/mail");
const config_1 = require("../config/config");
const types_1 = require("../modules/types");
let scheduledEmailQueue = null;
let scheduledEmailWorker = null;
const REPEAT_EVERY_MS = 60000;
const processScheduledEmails = async (_job) => {
    const pending = await prisma_1.prisma.scheduledEmailNotification.findMany({
        where: {
            status: "PENDING",
            OR: [{ scheduledFor: null }, { scheduledFor: { lte: new Date() } }],
        },
        orderBy: { createdAt: "asc" },
        take: 100,
    });
    if (pending.length === 0)
        return;
    logger_1.logger.info("[ScheduledEmailWorker] Processing batch", { count: pending.length });
    for (const email of pending) {
        try {
            await mail_1.mailService.send({
                to: email.email,
                subject: email.subject,
                html: email.body,
                text: email.body.replace(/<[^>]+>/g, ""),
            });
            await prisma_1.prisma.scheduledEmailNotification.update({
                where: { id: email.id },
                data: { status: "SENT", sentAt: new Date() },
            });
            logger_1.logger.debug("[ScheduledEmailWorker] Sent", { emailId: email.id, to: email.email });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            await prisma_1.prisma.scheduledEmailNotification.update({
                where: { id: email.id },
                data: { status: "FAILED", failedReason: message },
            });
            logger_1.logger.error("[ScheduledEmailWorker] Failed to send", {
                emailId: email.id,
                to: email.email,
                error: message,
            });
        }
    }
};
const startScheduledEmailWorker = async () => {
    if (!config_1.isQueueEnabled || !config_1.areQueueWorkersEnabled) {
        logger_1.logger.info("[ScheduledEmailWorker] Disabled");
        return null;
    }
    if (scheduledEmailWorker)
        return scheduledEmailWorker;
    scheduledEmailQueue = new bullmq_1.Queue(types_1.QueueName.ScheduledEmail, {
        connection: (0, config_1.createRedisConnection)(),
        prefix: config_1.queuePrefix,
    });
    // Register (or re-register) the repeatable trigger — idempotent in BullMQ
    await scheduledEmailQueue.add("process-scheduled-emails", {}, { repeat: { every: REPEAT_EVERY_MS }, jobId: "scheduled-email-tick" });
    scheduledEmailWorker = new bullmq_1.Worker(types_1.QueueName.ScheduledEmail, processScheduledEmails, {
        connection: (0, config_1.createRedisConnection)(),
        prefix: config_1.queuePrefix,
        concurrency: 1,
    });
    scheduledEmailWorker.on("ready", () => logger_1.logger.info("[ScheduledEmailWorker] Ready"));
    scheduledEmailWorker.on("completed", (job) => logger_1.logger.debug("[ScheduledEmailWorker] Tick completed", { jobId: job.id }));
    scheduledEmailWorker.on("failed", (job, err) => logger_1.logger.error("[ScheduledEmailWorker] Tick failed", { jobId: job?.id, error: err.message }));
    scheduledEmailWorker.on("error", (err) => logger_1.logger.error("[ScheduledEmailWorker] Error", { error: err.message }));
    return scheduledEmailWorker;
};
exports.startScheduledEmailWorker = startScheduledEmailWorker;
const closeScheduledEmailWorker = async () => {
    if (scheduledEmailWorker) {
        await scheduledEmailWorker.close();
        scheduledEmailWorker = null;
    }
    if (scheduledEmailQueue) {
        await scheduledEmailQueue.close();
        scheduledEmailQueue = null;
    }
};
exports.closeScheduledEmailWorker = closeScheduledEmailWorker;
