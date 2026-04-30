import { Queue } from "bullmq";
import { createRedisConnection, defaultJobOptions, isQueueEnabled, queuePrefix } from "@/queue/config/config";
import { NotificationJobData, NotificationJobName, QueueName } from "@/queue/modules/types";

let notificationQueue: Queue<NotificationJobData, void, NotificationJobName> | null = null;

const getNotificationQueue = (): Queue<NotificationJobData, void, NotificationJobName> => {
  if (!notificationQueue) {
    notificationQueue = new Queue<NotificationJobData, void, NotificationJobName>(
      QueueName.Notification,
      {
        connection: createRedisConnection(),
        prefix: queuePrefix,
        defaultJobOptions,
      },
    );
  }
  return notificationQueue;
};

/**
 * Enqueue a push-notification job.
 * Falls back to a no-op if QUEUE_ENABLED=false so callers don't need to guard.
 */
export const enqueueNotificationJob = async (
  data: NotificationJobData,
  options?: { delay?: number },
): Promise<void> => {
  if (!isQueueEnabled) return; // graceful no-op — Pusher push won't fire
  await getNotificationQueue().add("push-notification", data, { delay: options?.delay });
};

export const closeNotificationQueue = async (): Promise<void> => {
  if (!notificationQueue) return;
  await notificationQueue.close();
  notificationQueue = null;
};
