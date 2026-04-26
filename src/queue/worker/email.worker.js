"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeEmailWorker = exports.startEmailWorker = void 0;
const bullmq_1 = require("bullmq");
const logger_1 = require("../../modules/system/log/logger");
const mail_1 = require("../../share/component/mail");
const config_1 = require("../config/config");
const types_1 = require("../modules/types");
let emailWorker = null;
const processEmailJob = async (job) => {
    await mail_1.mailService.send({
        to: job.data.to,
        subject: job.data.subject,
        html: job.data.html,
        text: job.data.text,
    });
    logger_1.logger.info("Email job processed", {
        queue: types_1.QueueName.Email,
        jobId: job.id,
        to: job.data.to,
        traceId: job.data.traceId,
    });
};
const startEmailWorker = () => {
    if (!config_1.isQueueEnabled || !config_1.areQueueWorkersEnabled) {
        logger_1.logger.info("Email worker is disabled", {
            queueEnabled: config_1.isQueueEnabled,
            workersEnabled: config_1.areQueueWorkersEnabled,
        });
        return null;
    }
    if (emailWorker) {
        return emailWorker;
    }
    emailWorker = new bullmq_1.Worker(types_1.QueueName.Email, processEmailJob, {
        connection: (0, config_1.createRedisConnection)(),
        prefix: config_1.queuePrefix,
        concurrency: 5,
    });
    emailWorker.on("ready", () => {
        logger_1.logger.info("Email worker is ready");
    });
    emailWorker.on("completed", (job) => {
        logger_1.logger.info("Email job completed", { queue: types_1.QueueName.Email, jobId: job.id });
    });
    emailWorker.on("failed", (job, error) => {
        logger_1.logger.error("Email job failed", {
            queue: types_1.QueueName.Email,
            jobId: job?.id,
            error: error.message,
        });
    });
    emailWorker.on("error", (error) => {
        logger_1.logger.error("Email worker error", { error: error.message });
    });
    return emailWorker;
};
exports.startEmailWorker = startEmailWorker;
const closeEmailWorker = async () => {
    if (!emailWorker) {
        return;
    }
    await emailWorker.close();
    emailWorker = null;
};
exports.closeEmailWorker = closeEmailWorker;
