import { logger } from "../modules/system/log/logger";
import { areQueueWorkersEnabled, isQueueEnabled, queuePrefix } from "./config/config";
import { closeEmailQueue } from "./config/email.queue";
import { closeEmailWorker, startEmailWorker } from "./worker/email.worker";

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
};

export const shutdownQueueInfrastructure = async (): Promise<void> => {
  await Promise.allSettled([closeEmailWorker(), closeEmailQueue()]);
  logger.info("Queue infrastructure shut down");
};

export * from "./config/config";
export * from "./modules/types";
export * from "./config/email.queue";
export * from "./worker/email.worker";
