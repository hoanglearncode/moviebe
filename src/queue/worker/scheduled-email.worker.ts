import { Job, Queue, Worker } from "bullmq";
import { prisma } from "@/share/component/prisma";
import { logger } from "@/modules/system/log/logger";
import { mailService } from "@/share/component/mail";
import {
  areQueueWorkersEnabled,
  createRedisConnection,
  isQueueEnabled,
  queuePrefix,
} from "@/queue/config/config";
import { QueueName, ScheduledEmailJobData, ScheduledEmailJobName } from "@/queue/modules/types";
import { getSystemSettingsService } from "@/modules/admin-manage/admin-system-settings";

let scheduledEmailQueue: Queue<ScheduledEmailJobData, void, ScheduledEmailJobName> | null = null;
let scheduledEmailWorker: Worker<ScheduledEmailJobData, void, ScheduledEmailJobName> | null = null;

const REPEAT_EVERY_MS = 60_000;

const processScheduledEmails = async (
  _job: Job<ScheduledEmailJobData, void, ScheduledEmailJobName>,
): Promise<void> => {
  const isMaintenance = await getSystemSettingsService().isMaintenanceMode();
  if (isMaintenance) {
    logger.info("[ScheduledEmailWorker] Skipped tick — system is in maintenance mode");
    return;
  }

  const pending = await prisma.scheduledEmailNotification.findMany({
    where: {
      status: "PENDING",
      OR: [{ scheduledFor: null }, { scheduledFor: { lte: new Date() } }],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  if (pending.length === 0) return;

  logger.info("[ScheduledEmailWorker] Processing batch", { count: pending.length });

  for (const email of pending) {
    try {
      await mailService.send({
        to: email.email,
        subject: email.subject,
        html: email.body,
        text: email.body.replace(/<[^>]+>/g, ""),
      });

      await prisma.scheduledEmailNotification.update({
        where: { id: email.id },
        data: { status: "SENT", sentAt: new Date() },
      });

      logger.debug("[ScheduledEmailWorker] Sent", { emailId: email.id, to: email.email });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.scheduledEmailNotification.update({
        where: { id: email.id },
        data: { status: "FAILED", failedReason: message },
      });
      logger.error("[ScheduledEmailWorker] Failed to send", {
        emailId: email.id,
        to: email.email,
        error: message,
      });
    }
  }
};

export const startScheduledEmailWorker = async (): Promise<Worker<
  ScheduledEmailJobData,
  void,
  ScheduledEmailJobName
> | null> => {
  if (!isQueueEnabled || !areQueueWorkersEnabled) {
    logger.info("[ScheduledEmailWorker] Disabled");
    return null;
  }

  if (scheduledEmailWorker) return scheduledEmailWorker;

  scheduledEmailQueue = new Queue<ScheduledEmailJobData, void, ScheduledEmailJobName>(
    QueueName.ScheduledEmail,
    {
      connection: createRedisConnection(),
      prefix: queuePrefix,
    },
  );

  // Register (or re-register) the repeatable trigger — idempotent in BullMQ
  await scheduledEmailQueue.add(
    "process-scheduled-emails",
    {},
    { repeat: { every: REPEAT_EVERY_MS }, jobId: "scheduled-email-tick" },
  );

  scheduledEmailWorker = new Worker<ScheduledEmailJobData, void, ScheduledEmailJobName>(
    QueueName.ScheduledEmail,
    processScheduledEmails,
    {
      connection: createRedisConnection(),
      prefix: queuePrefix,
      concurrency: 1,
    },
  );

  scheduledEmailWorker.on("ready", () => logger.info("[ScheduledEmailWorker] Ready"));
  scheduledEmailWorker.on("completed", (job) =>
    logger.debug("[ScheduledEmailWorker] Tick completed", { jobId: job.id }),
  );
  scheduledEmailWorker.on("failed", (job, err) =>
    logger.error("[ScheduledEmailWorker] Tick failed", { jobId: job?.id, error: err.message }),
  );
  scheduledEmailWorker.on("error", (err) =>
    logger.error("[ScheduledEmailWorker] Error", { error: err.message }),
  );

  return scheduledEmailWorker;
};

export const closeScheduledEmailWorker = async (): Promise<void> => {
  if (scheduledEmailWorker) {
    await scheduledEmailWorker.close();
    scheduledEmailWorker = null;
  }
  if (scheduledEmailQueue) {
    await scheduledEmailQueue.close();
    scheduledEmailQueue = null;
  }
};
