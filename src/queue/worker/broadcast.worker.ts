import { Job, Worker } from "bullmq";
import { randomUUID } from "crypto";
import { NotificationType, BroadcastTarget, BroadcastChannel, Role } from "@prisma/client";
import { prisma } from "../../share/component/prisma";
import { logger } from "../../modules/system/log/logger";
import {
  areQueueWorkersEnabled,
  createRedisConnection,
  isQueueEnabled,
  queuePrefix,
} from "../config/config";
import { BroadcastJobData, BroadcastJobName, QueueName } from "../modules/types";
import { enqueueEmailJob } from "../config/email.queue";
import { enqueueNotificationJob } from "../config/notification.queue";

let broadcastWorker: Worker<BroadcastJobData, void, BroadcastJobName> | null = null;

const BATCH_SIZE = 100;

const buildUserWhere = (target: string) => {
  if (target === BroadcastTarget.ALL) return {};
  if (target === BroadcastTarget.OWNERS) return { role: Role.PARTNER };
  return { role: Role.USER };
};

const processBroadcastJob = async (
  job: Job<BroadcastJobData, void, BroadcastJobName>,
): Promise<void> => {
  const { broadcastId, target, channel, title, message } = job.data;

  const userWhere = buildUserWhere(target);
  const shouldPushWebsite =
    channel === BroadcastChannel.ALL ||
    channel === BroadcastChannel.WEBSITE ||
    channel === BroadcastChannel.DESKTOP ||
    channel === BroadcastChannel.MOBILE;
  const shouldSendEmail =
    channel === BroadcastChannel.ALL || channel === BroadcastChannel.EMAIL;
  let cursor: string | undefined;
  let totalSent = 0;

  logger.info("[BroadcastWorker] Starting delivery", { broadcastId, target, channel });

  while (true) {
    const users = await prisma.user.findMany({
      where: userWhere,
      select: { id: true, email: true },
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
    });

    if (users.length === 0) break;

    if (shouldPushWebsite) {
      const notifications = users.map((u) => ({
        id: randomUUID(),
        userId: u.id,
        type: NotificationType.SYSTEM,
        title,
        message,
        data: { broadcastId } as object,
        isRead: false,
      }));

      await prisma.notification.createMany({ data: notifications });

      await Promise.all(
        notifications.map((n) =>
          enqueueNotificationJob({
            notificationId: n.id,
            userId: n.userId,
            type: n.type,
            title: n.title,
            message: n.message,
            data: { broadcastId },
            traceId: randomUUID(),
          }).catch((err: Error) => {
            logger.warn("[BroadcastWorker] Enqueue push failed for user", {
              userId: n.userId,
              error: err.message,
            });
          }),
        ),
      );
    }

    if (shouldSendEmail) {
      await Promise.all(
        users.map((u) =>
          enqueueEmailJob({
            to: u.email,
            subject: title,
            html: `<p>${message}</p>`,
            text: message.replace(/<[^>]+>/g, ""),
            traceId: randomUUID(),
          }).catch((err: Error) => {
            logger.warn("[BroadcastWorker] Enqueue email failed for user", {
              userId: u.id,
              error: err.message,
            });
          }),
        ),
      );
    }

    totalSent += users.length;
    cursor = users[users.length - 1].id;

    logger.debug("[BroadcastWorker] Batch delivered", {
      broadcastId,
      batchSize: users.length,
      totalSent,
    });
  }

  await prisma.broadcastNotification.update({
    where: { id: broadcastId },
    data: { totalSent, sentAt: new Date() },
  });

  logger.info("[BroadcastWorker] Delivery complete", { broadcastId, totalSent });
};

export const startBroadcastWorker = ():
  | Worker<BroadcastJobData, void, BroadcastJobName>
  | null => {
  if (!isQueueEnabled || !areQueueWorkersEnabled) {
    logger.info("[BroadcastWorker] Disabled");
    return null;
  }

  if (broadcastWorker) return broadcastWorker;

  broadcastWorker = new Worker<BroadcastJobData, void, BroadcastJobName>(
    QueueName.Broadcast,
    processBroadcastJob,
    {
      connection: createRedisConnection(),
      prefix: queuePrefix,
      concurrency: 1,
    },
  );

  broadcastWorker.on("ready", () => logger.info("[BroadcastWorker] Ready"));
  broadcastWorker.on("completed", (job) =>
    logger.info("[BroadcastWorker] Completed", { jobId: job.id }),
  );
  broadcastWorker.on("failed", (job, err) =>
    logger.error("[BroadcastWorker] Failed", { jobId: job?.id, error: err.message }),
  );
  broadcastWorker.on("error", (err) =>
    logger.error("[BroadcastWorker] Error", { error: err.message }),
  );

  return broadcastWorker;
};

export const closeBroadcastWorker = async (): Promise<void> => {
  if (!broadcastWorker) return;
  await broadcastWorker.close();
  broadcastWorker = null;
};
