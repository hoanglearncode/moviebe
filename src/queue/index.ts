import { logger } from "@/modules/system/log/logger";
import { areQueueWorkersEnabled, isQueueEnabled, queuePrefix } from "@/queue/config/config";
import { closeBroadcastQueue } from "@/queue/config/broadcast.queue";
import { closeEmailQueue } from "@/queue/config/email.queue";
import { closeLockQueue } from "@/queue/config/lock.queue";
import { closeNotificationQueue } from "@/queue/config/notification.queue";
import { closeBroadcastWorker, startBroadcastWorker } from "@/queue/worker/broadcast.worker";
import { closeEmailWorker, startEmailWorker } from "@/queue/worker/email.worker";
import { closeLockWorker, startLockWorker } from "@/queue/worker/lock.work";
import {
  closeNotificationWorker,
  startNotificationWorker,
} from "@/queue/worker/notification.worker";
import {
  closeScheduledEmailWorker,
  startScheduledEmailWorker,
} from "@/queue/worker/scheduled-email.worker";
import { closeSeatCleanupWorker, startSeatCleanupWorker } from "@/queue/worker/seat-cleanup.worker";

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
  startLockWorker();
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
    closeLockWorker(),
    closeLockQueue(),
    closeScheduledEmailWorker(),
    closeSeatCleanupWorker(),
  ]);
  logger.info("Queue infrastructure shut down");
};

export * from "@/queue/config/config";
export * from "@/queue/modules/types";
export * from "@/queue/config/email.queue";
export * from "@/queue/config/notification.queue";
export * from "@/queue/config/broadcast.queue";
export * from "@/queue/config/lock.queue";
export * from "@/queue/worker/email.worker";
export * from "@/queue/worker/notification.worker";
export * from "@/queue/worker/broadcast.worker";
export * from "@/queue/worker/lock.work";
