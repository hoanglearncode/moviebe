import { Queue } from "bullmq";
import {
  createRedisConnection,
  defaultJobOptions,
  isQueueEnabled,
  queuePrefix,
} from "@/queue/config/config";
import { LockJobData, LockJobName, QueueName } from "@/queue/modules/types";

let lockQueue: Queue<LockJobData, void, LockJobName> | null = null;

const getLockQueue = (): Queue<LockJobData, void, LockJobName> => {
  if (!lockQueue) {
    lockQueue = new Queue<LockJobData, void, LockJobName>(QueueName.AccountLock, {
      connection: createRedisConnection(),
      prefix: queuePrefix,
      defaultJobOptions,
    });
  }

  return lockQueue;
};

export const enqueueUnlockAccount = async (
  data: LockJobData,
  options?: {
    jobId?: string;
    delay?: number;
  },
): Promise<void> => {
  if (!isQueueEnabled) {
    throw new Error("Queue system is disabled. Set QUEUE_ENABLED=true to enqueue jobs.");
  }

  await getLockQueue().add("unlock-account", data, {
    jobId: options?.jobId,
    delay: options?.delay,
  });
};

export const closeLockQueue = async (): Promise<void> => {
  if (!lockQueue) {
    return;
  }

  await lockQueue.close();
  lockQueue = null;
};
