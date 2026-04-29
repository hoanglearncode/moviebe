import { enqueueNotificationJob } from "../../../../queue/config/notification.queue";
import { INotificationQueue, NotificationJobData } from "../../interface";

export class NotificationQueueAdapter implements INotificationQueue {
  async enqueuePushNotification(data: NotificationJobData): Promise<void> {
    await enqueueNotificationJob(data);
  }
}
