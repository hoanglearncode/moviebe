import { logger } from "../modules/system/log/logger";
import { areQueueWorkersEnabled, isQueueEnabled, queuePrefix } from "./config/config";
import { closeBroadcastQueue } from "./config/broadcast.queue";
import { closeEmailQueue } from "./config/email.queue";
import { closeNotificationQueue } from "./config/notification.queue";
import { closeBroadcastWorker, startBroadcastWorker } from "./worker/broadcast.worker";
import { closeEmailWorker, startEmailWorker } from "./worker/email.worker";
import { closeNotificationWorker, startNotificationWorker } from "./worker/notification.worker";
import { closeScheduledEmailWorker, startScheduledEmailWorker } from "./worker/scheduled-email.worker";
import { closeSeatCleanupWorker, startSeatCleanupWorker } from "./worker/seat-cleanup.worker";

export const initializeQueueInfrastructure = async (): Promise<void> => {
  if (!isQueueEnabled) {
    logger.warn("Queue infrastructure is disabled");
    return;
  }

  logger.info("Initializing queue infrastructure", {
    prefix: queuePrefix,
    workersEnabled: areQueueWorkersEnabled,
  });

  startEmailWorker();
  startNotificationWorker();
  startBroadcastWorker();
  startSeatCleanupWorker();
  await startScheduledEmailWorker();
};

export const shutdownQueueInfrastructure = async (): Promise<void> => {
  await Promise.allSettled([
    closeEmailWorker(),
    closeEmailQueue(),
    closeNotificationWorker(),
    closeNotificationQueue(),
    closeBroadcastWorker(),
    closeBroadcastQueue(),
    closeScheduledEmailWorker(),
    closeSeatCleanupWorker(),
  ]);
  logger.info("Queue infrastructure shut down");
};

export * from "./config/config";
export * from "./modules/types";
export * from "./config/email.queue";
export * from "./config/notification.queue";
export * from "./config/broadcast.queue";
export * from "./worker/email.worker";
export * from "./worker/notification.worker";
export * from "./worker/broadcast.worker";
