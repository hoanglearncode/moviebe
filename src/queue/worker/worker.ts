import { logger } from "@/modules/system/log/logger";
import { initializeQueueInfrastructure, shutdownQueueInfrastructure } from "@/queue";
import { initSystemSettingsService } from "@/modules/admin-manage/admin-system-settings";
import { prisma } from "@/share/component/prisma";

const shutdown = async (signal: string) => {
  logger.info(`Queue worker received ${signal}`);
  await shutdownQueueInfrastructure();
  process.exit(0);
};

(async () => {
  initSystemSettingsService(prisma);
  await initializeQueueInfrastructure();
  logger.info("Queue worker started");
})();

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
