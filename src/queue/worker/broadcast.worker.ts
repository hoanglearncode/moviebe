import { Job, Worker } from "bullmq";
import { randomUUID } from "crypto";
import {
  NotificationType,
  BroadcastTarget,
  BroadcastChannel,
  BroadcastStatus,
  Role,
  UserStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/share/component/prisma";
import { logger } from "@/modules/system/log/logger";
import {
  areQueueWorkersEnabled,
  createRedisConnection,
  isQueueEnabled,
  queuePrefix,
} from "@/queue/config/config";
import { BroadcastJobData, BroadcastJobName, QueueName } from "@/queue/modules/types";
import { enqueueEmailJob } from "@/queue/config/email.queue";
import { enqueueNotificationJob } from "@/queue/config/notification.queue";
import { getSystemSettingsService } from "@/modules/admin-manage/admin-system-settings";

let broadcastWorker: Worker<BroadcastJobData, void, BroadcastJobName> | null = null;

const BATCH_SIZE = 100;

/**
 * Build Prisma `where` clause for the target segment, adding setting filters based on
 * the delivery channel so we only reach users/partners who opted in.
 */
function buildUserWhere(target: string, channel: string): Prisma.UserWhereInput {
  const activeOnly = { status: UserStatus.ACTIVE };

  const wantsPush: Prisma.UserWhereInput = {
    OR: [{ settings: { is: null } }, { settings: { notifications: true } }],
  };

  const wantsEmail: Prisma.UserWhereInput = {
    OR: [{ settings: { is: null } }, { settings: { marketingEmails: true } }],
  };

  const partnerWantsPush: Prisma.UserWhereInput = {
    partner: {
      OR: [{ setting: { is: null } }, { setting: { notifySystemAlerts: true } }],
    },
  };

  const partnerWantsEmail: Prisma.UserWhereInput = {
    partner: {
      OR: [{ setting: { is: null } }, { setting: { emailSystemAlerts: true } }],
    },
  };

  const isPush =
    channel === BroadcastChannel.ALL ||
    channel === BroadcastChannel.WEBSITE ||
    channel === BroadcastChannel.DESKTOP ||
    channel === BroadcastChannel.MOBILE;

  const isEmail = channel === BroadcastChannel.ALL || channel === BroadcastChannel.EMAIL;

  // For ALL channel: must want at least one of push or email
  const settingFilterForUser: Prisma.UserWhereInput =
    channel === BroadcastChannel.ALL
      ? {
          OR: [
            { settings: { is: null } },
            { settings: { notifications: true } },
            { settings: { marketingEmails: true } },
          ],
        }
      : isPush
        ? wantsPush
        : wantsEmail;

  const settingFilterForOwner: Prisma.UserWhereInput =
    channel === BroadcastChannel.ALL
      ? {
          partner: {
            OR: [
              { setting: { is: null } },
              { setting: { notifySystemAlerts: true } },
              { setting: { emailSystemAlerts: true } },
            ],
          },
        }
      : isPush
        ? partnerWantsPush
        : partnerWantsEmail;

  switch (target) {
    case BroadcastTarget.ALL:
      return { ...activeOnly };

    case BroadcastTarget.OWNERS:
      return { ...activeOnly, role: Role.PARTNER, ...settingFilterForOwner };

    case BroadcastTarget.USERS:
      return { ...activeOnly, role: Role.USER, ...settingFilterForUser };

    case BroadcastTarget.VIP:
    case BroadcastTarget.PREMIUM:
    case BroadcastTarget.FREE:
      logger.warn("[BroadcastWorker] Segment target has no subscription filter yet", { target });
      return { ...activeOnly, role: Role.USER, ...settingFilterForUser };

    default:
      logger.warn("[BroadcastWorker] Unknown target, falling back to USERS", { target });
      return { ...activeOnly, role: Role.USER, ...settingFilterForUser };
  }
}

const processBroadcastJob = async (
  job: Job<BroadcastJobData, void, BroadcastJobName>,
): Promise<void> => {
  const { broadcastId, target, channel, title, message, imageUrls = [], broadcastType } = job.data;

  // Halt delivery during maintenance — mark as failed so it can be retried
  const isMaintenance = await getSystemSettingsService().isMaintenanceMode();
  if (isMaintenance) {
    await prisma.broadcastNotification.update({
      where: { id: broadcastId },
      data: { status: BroadcastStatus.FAILED },
    });
    logger.warn("[BroadcastWorker] Skipped — system is in maintenance mode", { broadcastId });
    throw new Error("System is in maintenance mode");
  }

  const userWhere = buildUserWhere(target, channel);

  const shouldPushWebsite =
    channel === BroadcastChannel.ALL ||
    channel === BroadcastChannel.WEBSITE ||
    channel === BroadcastChannel.DESKTOP ||
    channel === BroadcastChannel.MOBILE;

  const shouldSendEmail = channel === BroadcastChannel.ALL || channel === BroadcastChannel.EMAIL;

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

    logger.debug("[BroadcastWorker] Batch delivered", {
      broadcastId,
      batchSize: users.length,
      totalSent,
    });
  }

  await prisma.broadcastNotification.update({
    where: { id: broadcastId },
    data: { totalSent, sentAt: new Date(), status: BroadcastStatus.SENT },
  });

  logger.info("[BroadcastWorker] Delivery complete", { broadcastId, totalSent });
};

export const startBroadcastWorker = (): Worker<BroadcastJobData, void, BroadcastJobName> | null => {
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
