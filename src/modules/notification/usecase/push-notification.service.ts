import { NotificationType } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "../../../share/component/prisma";
import { enqueueNotificationJob } from "../../../queue/config/notification.queue";
import { logger } from "../../system/log/logger";

export type SendPushInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
};

export type ListNotificationsQuery = {
  page?: number;
  limit?: number;
  onlyUnread?: boolean;
};

/**
 * PushNotificationService
 *
 * Flow:
 *   send() → insert DB record → enqueue BullMQ job
 *   notification.worker → PusherService.pushToUser() → FE receives 'notification.new'
 */
export class PushNotificationService {
  /**
   * Create a persistent notification and enqueue the Pusher push.
   */
  async send(input: SendPushInput): Promise<void> {
    const { userId, type, title, message, data } = input;

    // 1. Persist notification
    const notification = await prisma.notification.create({
      data: {
        id: randomUUID(),
        userId,
        type,
        title,
        message,
        data: (data ?? {}) as any,
        isRead: false,
      },
    });

    // 2. Enqueue for async Pusher delivery
    await enqueueNotificationJob({
      notificationId: notification.id,
      userId,
      type,
      title,
      message,
      data,
      traceId: randomUUID(),
    }).catch((err) => {
      // Queue unavailable (Redis down, etc.) — notification is persisted; push won't arrive realtime
      logger.warn("[PushNotification] Enqueue failed, notification saved but push delayed", {
        notificationId: notification.id,
        error: err.message,
      });
    });
  }

  /**
   * List a user's notifications with pagination.
   */
  async list(
    userId: string,
    query: ListNotificationsQuery = {},
  ): Promise<{ items: any[]; total: number; unreadCount: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.onlyUnread) where.isRead = false;

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { items, total, unreadCount };
  }

  /**
   * Mark a single notification as read.
   */
  async markRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Mark all of a user's notifications as read.
   */
  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: result.count };
  }

  /**
   * Delete a single notification.
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }

  /**
   * Unread count only — lightweight for polling badges.
   */
  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await prisma.notification.count({ where: { userId, isRead: false } });
    return { count };
  }
}

// Singleton — reuse across modules
export const pushNotificationService = new PushNotificationService();

// ── Domain helper factories ───────────────────────────────────────────────────
// Use these for type-safe notification creation throughout the codebase.

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

  partnerWithdrawalFailed: (userId: string, withdrawalId: string, amount: number, reason: string) => ({
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

  showtimeCancelled: (userId: string, showtimeId: string, movieTitle: string, refundedTickets: number) => ({
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