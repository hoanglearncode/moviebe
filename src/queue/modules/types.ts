import { SendMailInput } from "../../share/component/mail";

export const QueueName = {
  Email: "email",
  Notification: "notification",
} as const;

export type QueueName = (typeof QueueName)[keyof typeof QueueName];

// ── Email ──────────────────────────────────────────────────────────────────

export type EmailJobName = "send-mail";

export type EmailJobData = SendMailInput & {
  traceId?: string;
};

// ── Notification ───────────────────────────────────────────────────────────

export type NotificationJobName = "push-notification";

export type NotificationJobData = {
  /** DB id của Notification record đã insert sẵn */
  notificationId: string;
  /** User nhận thông báo */
  userId: string;
  type: string;
  title: string;
  message: string;
  /** Extra payload gửi xuống FE qua Pusher */
  data?: Record<string, unknown>;
  traceId?: string;
};
