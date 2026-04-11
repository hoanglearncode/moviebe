import { SendMailInput } from "../../share/component/mail";

export const QueueName = {
  Email: "email",
} as const;

export type QueueName = (typeof QueueName)[keyof typeof QueueName];

export type EmailJobName = "send-mail";

export type EmailJobData = SendMailInput & {
  traceId?: string;
};
