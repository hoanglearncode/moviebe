import { Job, Worker } from "bullmq";
import {
  areQueueWorkersEnabled,
  createRedisConnection,
  isQueueEnabled,
  queuePrefix,
} from "@/queue/config/config";
import { logger } from "@/modules/system/log/logger";
import { LockJobData, LockJobName, QueueName } from "@/queue/modules/types";

let lockWorker: Worker<LockJobData, void, LockJobName> | null = null;
const redis = createRedisConnection();

const processUnlockAccountJob = async (job: Job<LockJobData, void, LockJobName>): Promise<void> => {
  const { userId, stage } = job.data;
  const lockKey = `auth:login:lock:${userId}`;

  const currentValue = await redis.get(lockKey);
  if (!currentValue) {
    logger.debug("[LockWorker] Unlock skipped because lock key no longer exists", {
      jobId: job.id,
      userId,
      stage,
    });
    return;
  }

  const [, currentStageString] = currentValue.split(":");
  const currentStage = Number(currentStageString ?? "0");

  if (currentStage !== stage) {
    logger.debug("[LockWorker] Unlock skipped because lock stage changed", {
      jobId: job.id,
      userId,
      expectedStage: stage,
      currentStage,
    });
    return;
  }

  await redis.del(lockKey);
  logger.info("[LockWorker] Temporary account lock released", {
    jobId: job.id,
    userId,
    stage,
  });
};

export const startLockWorker = (): Worker<LockJobData, void, LockJobName> | null => {
  if (!isQueueEnabled || !areQueueWorkersEnabled) {
    logger.info("[LockWorker] Disabled", {
      queueEnabled: isQueueEnabled,
      workersEnabled: areQueueWorkersEnabled,
    });
    return null;
  }

  if (lockWorker) return lockWorker;

  lockWorker = new Worker<LockJobData, void, LockJobName>(
    QueueName.AccountLock,
    processUnlockAccountJob,
    {
      connection: createRedisConnection(),
      prefix: queuePrefix,
      concurrency: 5,
    },
  );

  lockWorker.on("ready", () => logger.info("[LockWorker] Ready"));
  lockWorker.on("completed", (job) =>
    logger.debug("[LockWorker] Completed", { jobId: job.id, userId: job.data.userId }),
  );
  lockWorker.on("failed", (job, err) =>
    logger.error("[LockWorker] Failed", {
      jobId: job?.id,
      userId: job?.data.userId,
      error: err.message,
    }),
  );
  lockWorker.on("error", (err) => logger.error("[LockWorker] Error", { error: err.message }));

  return lockWorker;
};

export const closeLockWorker = async (): Promise<void> => {
  if (!lockWorker) {
    return;
  }

  await lockWorker.close();
  await redis.quit();
  lockWorker = null;
};
