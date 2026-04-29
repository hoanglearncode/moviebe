import { NotificationType } from "@prisma/client";
import { PagingDTO } from "../../../share";

export type NotificationPayload = Record<string, unknown>;

export type SendPushInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationPayload;
};

export type ListNotificationsQuery = {
  page?: number;
  limit?: number;
  onlyUnread?: boolean;
};

export type NotificationListItem = {
  id: string;
  userId: string;
  rawType: NotificationType;
  type: string;
  title: string;
  message: string;
  data: NotificationPayload | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
};

export type NotificationListResult = {
  items: NotificationListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
};

export type CreateNotificationInput = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationPayload;
};

export type NotificationJobData = {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationPayload;
  traceId: string;
};

export interface IPushNotificationRepository {
  createNotification(input: CreateNotificationInput): Promise<void>;
  listNotifications(userId: string, query: ListNotificationsQuery): Promise<NotificationListResult>;
  findNotificationWithData(notificationId: string, userId: string): Promise<{ isRead: boolean; data: NotificationPayload | null } | null>;
  findUnreadNotificationsWithData(userId: string): Promise<Array<{ data: NotificationPayload | null }>>;
  markNotificationRead(notificationId: string, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<number>;
  deleteNotification(notificationId: string, userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
  incrementBroadcastReadCounts(broadcastCounts: Map<string, number>): Promise<void>;
}

export interface IPushNotificationUseCase  {

}

export interface INotificationQueue {
  enqueuePushNotification(data: NotificationJobData): Promise<void>;
}
