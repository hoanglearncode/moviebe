import { createRedisConnection } from "@/queue/config/config";
import { enqueueUnlockAccount } from "@/queue/config/lock.queue";
import { logger } from "@/modules/system/log/logger";

const redis = createRedisConnection();

const FAILED_LOGIN_ATTEMPT_WINDOW_SECONDS = 300; // Keep failed attempts counts for 5 minutes
const LOGIN_LOCK_STAGE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const LOGIN_LOCK_DURATIONS_MS = [0, 60_000, 10 * 60_000, 30 * 60_000];
export const PERMANENT_LOGIN_LOCK_STAGE = 4;

export const getLoginFailCountKey = (userId: string): string => `auth:login:fail-count:${userId}`;
export const getLoginLockKey = (userId: string): string => `auth:login:lock:${userId}`;
export const getLoginStageKey = (userId: string): string => `auth:login:stage:${userId}`;

export const isLoginTemporarilyLocked = async (userId: string): Promise<boolean> => {
  const ttl = await redis.ttl(getLoginLockKey(userId));
  return ttl === -1 || ttl > 0;
};

export const clearLoginLockStateOnSuccess = async (userId: string): Promise<void> => {
  await redis.del(
    getLoginFailCountKey(userId),
    getLoginLockKey(userId),
    getLoginStageKey(userId),
  );
};

export const incrementLoginFailCount = async (userId: string): Promise<number> => {
  const key = getLoginFailCountKey(userId);
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, FAILED_LOGIN_ATTEMPT_WINDOW_SECONDS);
  }
  return count;
};

export const getLoginLockStage = async (userId: string): Promise<number> => {
  const stage = await redis.get(getLoginStageKey(userId));
  return Number(stage ?? 0);
};

export const applyLoginLock = async (userId: string, stage: number): Promise<number> => {
  if (stage >= PERMANENT_LOGIN_LOCK_STAGE) {
    await redis.del(getLoginFailCountKey(userId), getLoginLockKey(userId));
    return 0;
  }

  const durationMs = LOGIN_LOCK_DURATIONS_MS[stage] ?? 0;

  await redis
    .multi()
    .set(getLoginLockKey(userId), `stage:${stage}`, "PX", durationMs)
    .set(getLoginStageKey(userId), String(stage), "EX", LOGIN_LOCK_STAGE_TTL_SECONDS)
    .del(getLoginFailCountKey(userId))
    .exec();

  try {
    await enqueueUnlockAccount(
      { userId, stage },
      {
        jobId: `unlock-account:${userId}:${stage}`,
        delay: durationMs,
      },
    );
  } catch (error) {
    logger.warn("[AuthLoginLock] Failed to enqueue unlock job; lock TTL will still expire", {
      userId,
      stage,
      durationMs,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return durationMs;
};

export const setPermanentLoginLockStage = async (userId: string): Promise<void> => {
  await redis.set(getLoginStageKey(userId), String(PERMANENT_LOGIN_LOCK_STAGE));
  await redis.del(getLoginFailCountKey(userId), getLoginLockKey(userId));
};
