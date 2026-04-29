import IORedis, { RedisOptions } from "ioredis";
import { JobsOptions } from "bullmq";
import { ENV } from "../../share/common/value";

const parseQueueBoolean = (value?: string): boolean => value === "true";

export const isQueueEnabled = parseQueueBoolean(process.env.QUEUE_ENABLED);
export const areQueueWorkersEnabled = parseQueueBoolean(process.env.QUEUE_WORKERS_ENABLED);

export const queueConnectionOptions: RedisOptions = {
  host: ENV.REDIS_HOST,
  port: ENV.REDIS_PORT,
  username: ENV.REDIS_USERNAME,
  password: ENV.REDIS_PASSWORD,
  db: ENV.REDIS_DB,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export const queuePrefix = ENV.QUEUE_PREFIX;

export const defaultJobOptions: JobsOptions = {
  attempts: ENV.QUEUE_JOB_ATTEMPTS,
  backoff: {
    type: "exponential",
    delay: ENV.QUEUE_JOB_BACKOFF_MS,
  },
  removeOnComplete: ENV.QUEUE_REMOVE_ON_COMPLETE_COUNT,
  removeOnFail: ENV.QUEUE_REMOVE_ON_FAIL_COUNT,
};

export const createRedisConnection = (): IORedis => new IORedis(queueConnectionOptions);
