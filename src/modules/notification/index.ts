export type {
  IEmailTemplateRepository,
  IScheduledEmailRepository,
} from "@/modules/notification/infras/repository/repository";
export { EmailTemplateRepository, ScheduledEmailRepository } from "@/modules/notification/infras/repository/repository";
export type { EmailNotificationPayload } from "@/modules/notification/model/types";
export { EmailNotificationEventType } from "@/modules/notification/model/types";
export { EmailNotificationService } from "@/modules/notification/usecase/service";
export { seedEmailTemplates } from "@/modules/notification/shared/seed";

// Push Notification
export {
  PushNotificationService,
  pushNotificationService,
  NotificationFactory,
} from "@/modules/notification/usecase/push-notification";
export type { SendPushInput, ListNotificationsQuery } from "@/modules/notification/usecase/push-notification";
export { default as notificationRouter } from "@/modules/notification/infras/transport/notification-endpoints";
