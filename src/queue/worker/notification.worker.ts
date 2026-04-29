import { Job, Worker } from "bullmq";
import { logger } from "../../modules/system/log/logger";
import { PusherService } from "../../socket/services";
import {
  areQueueWorkersEnabled,
  createRedisConnection,
  isQueueEnabled,
  queuePrefix,
} from "../config/config";
import { NotificationJobData, NotificationJobName, QueueName } from "../modules/types";

let notificationWorker: Worker<NotificationJobData, void, NotificationJobName> | null = null;

const processNotificationJob = async (
  job: Job<NotificationJobData, void, NotificationJobName>,
): Promise<void> => {
  const { notificationId, userId, type, title, message, data } = job.data;

  await PusherService.trigger(`private-user-${userId}`, "notification.new", {
    id: notificationId,
    type,
    title,
    message,
    data: data ?? {},
    createdAt: new Date().toISOString(),
  });

  logger.info("[NotificationWorker] Pushed", {
    jobId: job.id,
    userId,
    type,
    traceId: job.data.traceId,
  });
};

export const startNotificationWorker = (): Worker<
  NotificationJobData,
  void,
  NotificationJobName
> | null => {
  if (!isQueueEnabled || !areQueueWorkersEnabled) {
    logger.info("[NotificationWorker] Disabled", {
      queueEnabled: isQueueEnabled,
      workersEnabled: areQueueWorkersEnabled,
    });
    return null;
  }

  if (notificationWorker) return notificationWorker;

  notificationWorker = new Worker<NotificationJobData, void, NotificationJobName>(
    QueueName.Notification,
    processNotificationJob,
    {
      connection: createRedisConnection(),
      prefix: queuePrefix,
      concurrency: 10,
    },
  );

  notificationWorker.on("ready", () => logger.info("[NotificationWorker] Ready"));
  notificationWorker.on("completed", (job) =>
    logger.debug("[NotificationWorker] Completed", { jobId: job.id }),
  );
  notificationWorker.on("failed", (job, err) =>
    logger.error("[NotificationWorker] Failed", { jobId: job?.id, error: err.message }),
  );
  notificationWorker.on("error", (err) =>
    logger.error("[NotificationWorker] Error", { error: err.message }),
  );

  return notificationWorker;
};

export const closeNotificationWorker = async (): Promise<void> => {
  if (!notificationWorker) return;
  await notificationWorker.close();
  notificationWorker = null;
};
