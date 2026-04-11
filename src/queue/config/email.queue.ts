import { Queue } from "bullmq";
import { createRedisConnection, defaultJobOptions, isQueueEnabled, queuePrefix } from "./config";
import { EmailJobData, EmailJobName, QueueName } from "../modules/types";

let emailQueue: Queue<EmailJobData, void, EmailJobName> | null = null;

const getEmailQueue = (): Queue<EmailJobData, void, EmailJobName> => {
  if (!emailQueue) {
    emailQueue = new Queue<EmailJobData, void, EmailJobName>(QueueName.Email, {
      connection: createRedisConnection(),
      prefix: queuePrefix,
      defaultJobOptions,
    });
  }

  return emailQueue;
};

export const enqueueEmailJob = async (
  data: EmailJobData,
  options?: {
    jobId?: string;
    delay?: number;
  },
): Promise<void> => {
  if (!isQueueEnabled) {
    throw new Error("Queue system is disabled. Set QUEUE_ENABLED=true to enqueue jobs.");
  }

  await getEmailQueue().add("send-mail", data, {
    jobId: options?.jobId,
    delay: options?.delay,
  });
};

export const closeEmailQueue = async (): Promise<void> => {
  if (!emailQueue) {
    return;
  }

  await emailQueue.close();
  emailQueue = null;
};
