"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeEmailQueue = exports.enqueueEmailJob = void 0;
const bullmq_1 = require("bullmq");
const config_1 = require("./config");
const types_1 = require("./types");
let emailQueue = null;
const getEmailQueue = () => {
    if (!emailQueue) {
        emailQueue = new bullmq_1.Queue(types_1.QueueName.Email, {
            connection: (0, config_1.createRedisConnection)(),
            prefix: config_1.queuePrefix,
            defaultJobOptions: config_1.defaultJobOptions,
        });
    }
    return emailQueue;
};
const enqueueEmailJob = async (data, options) => {
    if (!config_1.isQueueEnabled) {
        throw new Error("Queue system is disabled. Set QUEUE_ENABLED=true to enqueue jobs.");
    }
    await getEmailQueue().add("send-mail", data, {
        jobId: options?.jobId,
        delay: options?.delay,
    });
};
exports.enqueueEmailJob = enqueueEmailJob;
const closeEmailQueue = async () => {
    if (!emailQueue) {
        return;
    }
    await emailQueue.close();
    emailQueue = null;
};
exports.closeEmailQueue = closeEmailQueue;
