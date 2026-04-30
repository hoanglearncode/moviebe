import { Job, Worker } from "bullmq";
import { logger } from "@/modules/system/log/logger";
import { mailService } from "@/share/component/mail";
import {
  areQueueWorkersEnabled,
  createRedisConnection,
  isQueueEnabled,
  queuePrefix,
} from "@/queue/config/config";
import { EmailJobData, EmailJobName, QueueName } from "@/queue/modules/types";

let emailWorker: Worker<EmailJobData, void, EmailJobName> | null = null;

const processEmailJob = async (job: Job<EmailJobData, void, EmailJobName>): Promise<void> => {
  await mailService.send({
    to: job.data.to,
    subject: job.data.subject,
    html: job.data.html,
    text: job.data.text,
  });

  logger.info("Email job processed", {
    queue: QueueName.Email,
    jobId: job.id,
    to: job.data.to,
    traceId: job.data.traceId,
  });
};

export const startEmailWorker = (): Worker<EmailJobData, void, EmailJobName> | null => {
  if (!isQueueEnabled || !areQueueWorkersEnabled) {
    logger.info("Email worker is disabled", {
      queueEnabled: isQueueEnabled,
      workersEnabled: areQueueWorkersEnabled,
    });
    return null;
  }

  if (emailWorker) {
    return emailWorker;
  }

  emailWorker = new Worker<EmailJobData, void, EmailJobName>(QueueName.Email, processEmailJob, {
    connection: createRedisConnection(),
    prefix: queuePrefix,
    concurrency: 5,
  });

  emailWorker.on("ready", () => {
    logger.info("Email worker is ready");
  });

  emailWorker.on("completed", (job) => {
    logger.info("Email job completed", { queue: QueueName.Email, jobId: job.id });
  });

  emailWorker.on("failed", (job, error) => {
    logger.error("Email job failed", {
      queue: QueueName.Email,
      jobId: job?.id,
      error: error.message,
    });
  });

  emailWorker.on("error", (error) => {
    logger.error("Email worker error", { error: error.message });
  });

  return emailWorker;
};

export const closeEmailWorker = async (): Promise<void> => {
  if (!emailWorker) {
    return;
  }

  await emailWorker.close();
  emailWorker = null;
};
