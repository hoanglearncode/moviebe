import { NotificationType } from "@prisma/client";
import { randomUUID } from "crypto";
import { logger } from "../../system/log/logger";
import { NotificationJobData, IPushNotificationRepository, INotificationQueue, SendPushInput, ListNotificationsQuery, NotificationListItem, NotificationPayload, NotificationListResult } from "../interface";

export class PushNotificationService {
  constructor(
    private readonly notificationRepo: IPushNotificationRepository,
    private readonly notificationQueue: INotificationQueue,
  ) {}

  private resolveDisplayType(type: NotificationType, data: unknown): string {
    if (type !== NotificationType.SYSTEM) return type;

    const payload =
      data && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : null;
    const broadcastType = payload?.broadcastType;

    if (
      typeof broadcastType === "string" &&
      ["INFO", "SUCCESS", "WARNING", "ERROR"].includes(broadcastType.toUpperCase())
    ) {
      return broadcastType.toUpperCase();
    }

    return type;
  }

  async send(input: SendPushInput): Promise<void> {
    const notificationId = randomUUID();

    await this.notificationRepo.createNotification({
      id: notificationId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data,
    });

    const jobPayload: NotificationJobData = {
      notificationId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data,
      traceId: randomUUID(),
    };

    await this.notificationQueue.enqueuePushNotification(jobPayload).catch((err) => {
      logger.warn("[PushNotification] Enqueue failed, notification saved but push delayed", {
        notificationId,
        error: err?.message ?? err,
      });
    });
  }

  async list(userId: string, query: ListNotificationsQuery = {}): Promise<NotificationListResult> {
    const result = await this.notificationRepo.listNotifications(userId, query);

    return {
      ...result,
      items: result.items.map((item: NotificationListItem) => ({
        ...item,
        type: this.resolveDisplayType(item.rawType, item.data),
      })),
    };
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepo.findNotificationWithData(notificationId, userId);
    if (!notification || notification.isRead) return;

    await this.notificationRepo.markNotificationRead(notificationId, userId);

    const broadcastId = (notification.data as Record<string, unknown> | null)?.broadcastId as string | undefined;
    if (!broadcastId) return;

    await this.notificationRepo.incrementBroadcastReadCounts(new Map([[broadcastId, 1]]));
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const unreadNotifications = await this.notificationRepo.findUnreadNotificationsWithData(userId);
    if (unreadNotifications.length === 0) return { updated: 0 };

    const updated = await this.notificationRepo.markAllNotificationsRead(userId);

    const broadcastCounts = new Map<string, number>();
    for (const notification of unreadNotifications) {
      const broadcastId = (notification.data as Record<string, unknown> | null)?.broadcastId as string | undefined;
      if (broadcastId) {
        broadcastCounts.set(broadcastId, (broadcastCounts.get(broadcastId) ?? 0) + 1);
      }
    }

    if (broadcastCounts.size > 0) {
      await this.notificationRepo.incrementBroadcastReadCounts(broadcastCounts);
    }

    return { updated };
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepo.deleteNotification(notificationId, userId);
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepo.getUnreadCount(userId);
    return { count };
  }
}

export const createPushNotificationService = (
  repository: IPushNotificationRepository,
  queue: INotificationQueue,
): PushNotificationService => new PushNotificationService(repository, queue);

export const NotificationFactory = {
  partnerWithdrawalPending: (userId: string, withdrawalId: string, amount: number) => ({
    userId,
    type: NotificationType.PARTNER_WITHDRAWAL_PENDING,
    title: "Yêu cầu rút tiền đang chờ xử lý",
    message: `Yêu cầu rút ${amount.toLocaleString("vi-VN")} VND đang được xử lý.`,
    data: { withdrawalId, amount },
  }),

  partnerWithdrawalCompleted: (userId: string, withdrawalId: string, amount: number) => ({
    userId,
    type: NotificationType.PARTNER_WITHDRAWAL_COMPLETED,
    title: "Rút tiền thành công",
    message: `${amount.toLocaleString("vi-VN")} VND đã được chuyển vào tài khoản của bạn.`,
    data: { withdrawalId, amount },
  }),

  partnerWithdrawalFailed: (
    userId: string,
    withdrawalId: string,
    amount: number,
    reason: string,
  ) => ({
    userId,
    type: NotificationType.PARTNER_WITHDRAWAL_FAILED,
    title: "Rút tiền thất bại",
    message: `Yêu cầu rút ${amount.toLocaleString("vi-VN")} VND thất bại: ${reason}`,
    data: { withdrawalId, amount, reason },
  }),

  partnerMovieApproved: (userId: string, movieId: string, title: string) => ({
    userId,
    type: NotificationType.PARTNER_MOVIE_APPROVED,
    title: "Phim đã được duyệt",
    message: `Phim "${title}" đã được admin phê duyệt và sẵn sàng lên lịch.`,
    data: { movieId, title },
  }),

  partnerMovieRejected: (userId: string, movieId: string, title: string, reason: string) => ({
    userId,
    type: NotificationType.PARTNER_MOVIE_REJECTED,
    title: "Phim bị từ chối",
    message: `Phim "${title}" bị từ chối. Lý do: ${reason}`,
    data: { movieId, title, reason },
  }),

  showtimeCancelled: (
    userId: string,
    showtimeId: string,
    movieTitle: string,
    refundedTickets: number,
  ) => ({
    userId,
    type: NotificationType.SHOWTIME_CANCELLED,
    title: "Suất chiếu đã bị hủy",
    message: `Suất chiếu phim "${movieTitle}" đã bị hủy. ${refundedTickets} vé đã được hoàn tiền.`,
    data: { showtimeId, movieTitle, refundedTickets },
  }),

  bookingConfirmed: (userId: string, bookingId: string, movieTitle: string, showtime: string) => ({
    userId,
    type: NotificationType.BOOKING_CONFIRMED,
    title: "Đặt vé thành công",
    message: `Bạn đã đặt vé xem "${movieTitle}" lúc ${showtime}.`,
    data: { bookingId, movieTitle, showtime },
  }),

  ticketRefunded: (userId: string, ticketId: string, amount: number) => ({
    userId,
    type: NotificationType.TICKET_REFUNDED,
    title: "Hoàn tiền vé",
    message: `${amount.toLocaleString("vi-VN")} VND đã được hoàn về ví của bạn.`,
    data: { ticketId, amount },
  }),

  system: (userId: string, title: string, message: string, data?: Record<string, unknown>) => ({
    userId,
    type: NotificationType.SYSTEM,
    title,
    message,
    data: data ?? {},
  }),
} as const;
