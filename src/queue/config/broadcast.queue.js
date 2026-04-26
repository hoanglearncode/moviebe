"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeBroadcastQueue = exports.enqueueBroadcastJob = void 0;
const bullmq_1 = require("bullmq");
const config_1 = require("./config");
const types_1 = require("../modules/types");
let broadcastQueue = null;
const getBroadcastQueue = () => {
    if (!broadcastQueue) {
        broadcastQueue = new bullmq_1.Queue(types_1.QueueName.Broadcast, {
            connection: (0, config_1.createRedisConnection)(),
            prefix: config_1.queuePrefix,
            defaultJobOptions: config_1.defaultJobOptions,
        });
    }
    return broadcastQueue;
};
const enqueueBroadcastJob = async (data) => {
    if (!config_1.isQueueEnabled)
        return;
    await getBroadcastQueue().add("deliver-broadcast", data);
};
exports.enqueueBroadcastJob = enqueueBroadcastJob;
const closeBroadcastQueue = async () => {
    if (!broadcastQueue)
        return;
    await broadcastQueue.close();
    broadcastQueue = null;
};
exports.closeBroadcastQueue = closeBroadcastQueue;
