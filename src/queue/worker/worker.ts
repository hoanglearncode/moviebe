import { logger } from "../../modules/system/log/logger";
import { initializeQueueInfrastructure, shutdownQueueInfrastructure } from "../index";

const shutdown = async (signal: string) => {
  logger.info(`Queue worker received ${signal}`);
  await shutdownQueueInfrastructure();
  process.exit(0);
};

(async () => {
  await initializeQueueInfrastructure();
  logger.info("Queue worker started");
})();

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
