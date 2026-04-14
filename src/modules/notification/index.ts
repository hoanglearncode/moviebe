export type { IEmailTemplateRepository, IScheduledEmailRepository } from "./infras/repository/repository";
export { EmailTemplateRepository, ScheduledEmailRepository } from "./infras/repository/repository";
export type { EmailNotificationPayload } from "./model/types";
export { EmailNotificationEventType } from "./model/types";
export { EmailNotificationService } from "./usecase/service";
export { seedEmailTemplates } from "./shared/seed";

// Push Notification
export {
  PushNotificationService,
  pushNotificationService,
  NotificationFactory,
} from "./usecase/push-notification.service";
export type { SendPushInput, ListNotificationsQuery } from "./usecase/push-notification.service";
export { default as notificationRouter } from "./infras/transport/notification-endpoints";
