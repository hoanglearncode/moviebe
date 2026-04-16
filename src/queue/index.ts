import { logger } from "../modules/system/log/logger";
import { areQueueWorkersEnabled, isQueueEnabled, queuePrefix } from "./config/config";
import { closeEmailQueue } from "./config/email.queue";
import { closeNotificationQueue } from "./config/notification.queue";
import { closeEmailWorker, startEmailWorker } from "./worker/email.worker";
import { closeNotificationWorker, startNotificationWorker } from "./worker/notification.worker";
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
  startSeatCleanupWorker();
};

export const shutdownQueueInfrastructure = async (): Promise<void> => {
  await Promise.allSettled([
    closeEmailWorker(),
    closeEmailQueue(),
    closeNotificationWorker(),
    closeNotificationQueue(),
    closeSeatCleanupWorker(),
  ]);
  logger.info("Queue infrastructure shut down");
};

export * from "./config/config";
export * from "./modules/types";
export * from "./config/email.queue";
export * from "./config/notification.queue";
export * from "./worker/email.worker";
export * from "./worker/notification.worker";
