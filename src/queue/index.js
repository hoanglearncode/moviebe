"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shutdownQueueInfrastructure = exports.initializeQueueInfrastructure = void 0;
const logger_1 = require("../modules/system/log/logger");
const config_1 = require("./config/config");
const broadcast_queue_1 = require("./config/broadcast.queue");
const email_queue_1 = require("./config/email.queue");
const notification_queue_1 = require("./config/notification.queue");
const broadcast_worker_1 = require("./worker/broadcast.worker");
const email_worker_1 = require("./worker/email.worker");
const notification_worker_1 = require("./worker/notification.worker");
const scheduled_email_worker_1 = require("./worker/scheduled-email.worker");
const seat_cleanup_worker_1 = require("./worker/seat-cleanup.worker");
const initializeQueueInfrastructure = async () => {
    if (!config_1.isQueueEnabled) {
        logger_1.logger.warn("Queue infrastructure is disabled");
        return;
    }
    logger_1.logger.info("Initializing queue infrastructure", {
        prefix: config_1.queuePrefix,
        workersEnabled: config_1.areQueueWorkersEnabled,
    });
    (0, email_worker_1.startEmailWorker)();
    (0, notification_worker_1.startNotificationWorker)();
    (0, broadcast_worker_1.startBroadcastWorker)();
    (0, seat_cleanup_worker_1.startSeatCleanupWorker)();
    await (0, scheduled_email_worker_1.startScheduledEmailWorker)();
};
exports.initializeQueueInfrastructure = initializeQueueInfrastructure;
const shutdownQueueInfrastructure = async () => {
    await Promise.allSettled([
        (0, email_worker_1.closeEmailWorker)(),
        (0, email_queue_1.closeEmailQueue)(),
        (0, notification_worker_1.closeNotificationWorker)(),
        (0, notification_queue_1.closeNotificationQueue)(),
        (0, broadcast_worker_1.closeBroadcastWorker)(),
        (0, broadcast_queue_1.closeBroadcastQueue)(),
        (0, scheduled_email_worker_1.closeScheduledEmailWorker)(),
        (0, seat_cleanup_worker_1.closeSeatCleanupWorker)(),
    ]);
    logger_1.logger.info("Queue infrastructure shut down");
};
exports.shutdownQueueInfrastructure = shutdownQueueInfrastructure;
__exportStar(require("./config/config"), exports);
__exportStar(require("./modules/types"), exports);
__exportStar(require("./config/email.queue"), exports);
__exportStar(require("./config/notification.queue"), exports);
__exportStar(require("./config/broadcast.queue"), exports);
__exportStar(require("./worker/email.worker"), exports);
__exportStar(require("./worker/notification.worker"), exports);
__exportStar(require("./worker/broadcast.worker"), exports);
