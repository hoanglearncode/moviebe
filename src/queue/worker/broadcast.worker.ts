import { Job, Worker } from "bullmq";
import { randomUUID } from "crypto";
import {
  NotificationType,
  BroadcastTarget,
  BroadcastChannel,
  BroadcastStatus,
  Role,
  UserStatus,
} from "@prisma/client";
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

/**
 * Returns Prisma `where` clause scoped to the correct recipient segment.
 *
 * NOTE: VIP / PREMIUM / FREE require a subscription relation on User (not yet migrated).
 * Until then they deliver to all active USER-role accounts.
 * TODO(subscription): add User.planSlug filter once schema is updated.
 */
function buildUserWhere(target: string) {
  const activeOnly = { status: UserStatus.ACTIVE };
  switch (target) {
    case BroadcastTarget.ALL:
      return activeOnly;
    case BroadcastTarget.OWNERS:
      return { ...activeOnly, role: Role.PARTNER };
    case BroadcastTarget.USERS:
      return { ...activeOnly, role: Role.USER };
    case BroadcastTarget.VIP:
    case BroadcastTarget.PREMIUM:
    case BroadcastTarget.FREE:
      logger.warn("[BroadcastWorker] Segment target has no subscription filter yet", { target });
      return { ...activeOnly, role: Role.USER };
    default:
      logger.warn("[BroadcastWorker] Unknown target, falling back to USERS", { target });
      return { ...activeOnly, role: Role.USER };
  }
}

const processBroadcastJob = async (
  job: Job<BroadcastJobData, void, BroadcastJobName>,
): Promise<void> => {
  const { broadcastId, target, channel, title, message, imageUrls = [], broadcastType } = job.data;

  const userWhere = buildUserWhere(target);

  // Channel → delivery mode flags
  const shouldPushWebsite =
    channel === BroadcastChannel.ALL ||
    channel === BroadcastChannel.WEBSITE ||
    channel === BroadcastChannel.DESKTOP ||
    channel === BroadcastChannel.MOBILE;

  const shouldSendEmail =
    channel === BroadcastChannel.ALL || channel === BroadcastChannel.EMAIL;

  // Notification data embedded in each user notification record
  // imageUrls and broadcastType let the FE render rich content and correct styling
  const notifData = {
    broadcastId,
    imageUrls,
    broadcastType: broadcastType ?? "INFO",
  };

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
        data: notifData as object,
        isRead: false,
      }));

      await prisma.notification.createMany({ data: notifications });

      await Promise.all(
        notifications.map((n) =>
          enqueueNotificationJob({
            notificationId: n.id,
            userId: n.userId,
            type: broadcastType ?? String(n.type),
            title: n.title,
            message: n.message,
            data: notifData,
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
            html: message,
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

    logger.debug("[BroadcastWorker] Batch delivered", { broadcastId, batchSize: users.length, totalSent });
  }

  // Update final delivery count on the broadcast record
  await prisma.broadcastNotification.update({
    where: { id: broadcastId },
    data: { totalSent, sentAt: new Date(), status: BroadcastStatus.SENT },
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
