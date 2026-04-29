import { Queue } from "bullmq";
import { createRedisConnection, defaultJobOptions, isQueueEnabled, queuePrefix } from "./config";
import { BroadcastJobData, BroadcastJobName, QueueName } from "../modules/types";

let broadcastQueue: Queue<BroadcastJobData, void, BroadcastJobName> | null = null;

const getBroadcastQueue = (): Queue<BroadcastJobData, void, BroadcastJobName> => {
  if (!broadcastQueue) {
    broadcastQueue = new Queue<BroadcastJobData, void, BroadcastJobName>(QueueName.Broadcast, {
      connection: createRedisConnection(),
      prefix: queuePrefix,
      defaultJobOptions,
    });
  }
  return broadcastQueue;
};

export const enqueueBroadcastJob = async (data: BroadcastJobData): Promise<void> => {
  if (!isQueueEnabled) return;
  await getBroadcastQueue().add("deliver-broadcast", data);
};

export const enqueueBroadcastJobWithDelay = async (
  data: BroadcastJobData,
  delayMs: number,
): Promise<void> => {
  if (!isQueueEnabled) return;
  await getBroadcastQueue().add("deliver-broadcast", data, {
    delay: Math.max(0, Math.floor(delayMs)),
  });
};

export const closeBroadcastQueue = async (): Promise<void> => {
  if (!broadcastQueue) return;
  await broadcastQueue.close();
  broadcastQueue = null;
};
