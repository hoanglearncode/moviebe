import { SendMailInput } from "../../share/component/mail";

export const QueueName = {
  Email: "email",
  Notification: "notification",
  Broadcast: "broadcast",
  ScheduledEmail: "scheduled-email",
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
  notificationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  traceId?: string;
};

// ── Broadcast ──────────────────────────────────────────────────────────────

export type BroadcastJobName = "deliver-broadcast";

export type BroadcastJobData = {
  broadcastId: string;
  target: string;
  channel: string;
  title: string;
  message: string;
  traceId?: string;
};

// ── Scheduled Email ────────────────────────────────────────────────────────

export type ScheduledEmailJobName = "process-scheduled-emails";

export type ScheduledEmailJobData = Record<string, never>;
