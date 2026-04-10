import { logger } from "../modules/system/log/logger";
import { areQueueWorkersEnabled, isQueueEnabled, queuePrefix } from "./config";
import { closeEmailQueue } from "./email.queue";
import { closeEmailWorker, startEmailWorker } from "./email.worker";

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

export * from "./config";
export * from "./types";
export * from "./email.queue";
export * from "./email.worker";
