import { Queue } from "bullmq";
import { createRedisConnection, isQueueEnabled, queuePrefix } from "@/queue/config/config";
import { QueueName } from "@/queue/modules/types";
import type { QueueStats } from "@/modules/admin-system-settings/model/model";

const EMPTY_STATS: QueueStats = { waiting: 0, active: 0, failed: 0 };

async function getStatsForQueue(name: string): Promise<QueueStats> {
  const q = new Queue(name, {
    connection: createRedisConnection(),
    prefix: queuePrefix,
  });
  try {
    const counts = await q.getJobCounts("waiting", "active", "failed");
    return {
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      failed: counts.failed ?? 0,
    };
  } finally {
    await q.disconnect().catch(() => {});
  }
}

export interface QueueHealth {
  email: QueueStats;
  notification: QueueStats;
  broadcast: QueueStats;
  totalFailed: number;
}

export async function getQueueHealth(): Promise<QueueHealth> {
  if (!isQueueEnabled) {
    return {
      email: EMPTY_STATS,
      notification: EMPTY_STATS,
      broadcast: EMPTY_STATS,
      totalFailed: 0,
    };
  }

  const [emailResult, notifResult, broadcastResult] = await Promise.allSettled([
    getStatsForQueue(QueueName.Email),
    getStatsForQueue(QueueName.Notification),
    getStatsForQueue(QueueName.Broadcast),
  ]);

  const email = emailResult.status === "fulfilled" ? emailResult.value : EMPTY_STATS;
  const notification = notifResult.status === "fulfilled" ? notifResult.value : EMPTY_STATS;
  const broadcast = broadcastResult.status === "fulfilled" ? broadcastResult.value : EMPTY_STATS;

  return {
    email,
    notification,
    broadcast,
    totalFailed: email.failed + notification.failed + broadcast.failed,
  };
}
