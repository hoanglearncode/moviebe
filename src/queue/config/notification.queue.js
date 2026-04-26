"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeNotificationQueue = exports.enqueueNotificationJob = void 0;
const bullmq_1 = require("bullmq");
const config_1 = require("./config");
const types_1 = require("../modules/types");
let notificationQueue = null;
const getNotificationQueue = () => {
    if (!notificationQueue) {
        notificationQueue = new bullmq_1.Queue(types_1.QueueName.Notification, {
            connection: (0, config_1.createRedisConnection)(),
            prefix: config_1.queuePrefix,
            defaultJobOptions: config_1.defaultJobOptions,
        });
    }
    return notificationQueue;
};
/**
 * Enqueue a push-notification job.
 * Falls back to a no-op if QUEUE_ENABLED=false so callers don't need to guard.
 */
const enqueueNotificationJob = async (data, options) => {
    if (!config_1.isQueueEnabled)
        return; // graceful no-op — Pusher push won't fire
    await getNotificationQueue().add("push-notification", data, { delay: options?.delay });
};
exports.enqueueNotificationJob = enqueueNotificationJob;
const closeNotificationQueue = async () => {
    if (!notificationQueue)
        return;
    await notificationQueue.close();
    notificationQueue = null;
};
exports.closeNotificationQueue = closeNotificationQueue;
