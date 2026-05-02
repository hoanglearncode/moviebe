import { NotificationType } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "@/share/component/prisma";
import { enqueueNotificationJob } from "@/queue/config/notification.queue";
import { logger } from "@/modules/system/log/logger";

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

  /**
   * Create a persistent notification and enqueue the Pusher push.
   */
  async send(input: SendPushInput): Promise<void> {
    const { userId, type, title, message, data } = input;

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

    await enqueueNotificationJob({
      notificationId: notification.id,
      userId,
      type,
      title,
      message,
      data,
      traceId: randomUUID(),
    }).catch((err) => {
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

    const normalizedItems = items.map((item) => ({
      ...item,
      rawType: item.type,
      type: this.resolveDisplayType(item.type, item.data),
    }));

    return { items: normalizedItems, total, unreadCount };
  }

  /**
   * Mark a single notification as read and increment the parent broadcast's readCount.
   */
  async markRead(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
      select: { isRead: true, data: true },
    });

    // Nothing to do — either missing or already read
    if (!notification || notification.isRead) return;

    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });

    // Increment readCount on the parent broadcast (non-fatal if broadcast was deleted)
    const broadcastId = (notification.data as Record<string, unknown> | null)?.broadcastId as
      | string
      | undefined;
    if (broadcastId) {
      await prisma.broadcastNotification
        .update({
          where: { id: broadcastId },
          data: { readCount: { increment: 1 } },
        })
        .catch(() => {});
    }
  }

  /**
   * Mark all of a user's notifications as read and bulk-update broadcast readCounts.
   */
  async markAllRead(userId: string): Promise<{ updated: number }> {
    // Collect unread notifications before updating (to know which broadcasts to increment)
    const unread = await prisma.notification.findMany({
      where: { userId, isRead: false },
      select: { id: true, data: true },
    });

    if (unread.length === 0) return { updated: 0 };

    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    // Aggregate per-broadcast increment counts
    const broadcastCounts = new Map<string, number>();
    for (const n of unread) {
      const bid = (n.data as Record<string, unknown> | null)?.broadcastId as string | undefined;
      if (bid) broadcastCounts.set(bid, (broadcastCounts.get(bid) ?? 0) + 1);
    }

    // Increment readCount on each affected broadcast (non-fatal)
    await Promise.all(
      Array.from(broadcastCounts.entries()).map(([broadcastId, count]) =>
        prisma.broadcastNotification
          .update({ where: { id: broadcastId }, data: { readCount: { increment: count } } })
          .catch(() => {}),
      ),
    );

    return { updated: result.count };
  }

  /**
   * Delete a single notification (owner only).
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

export const pushNotificationService = new PushNotificationService();

// ── Domain helper factories ───────────────────────────────────────────────────

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

  partnerRequestApproved: (userId: string, cinemaName: string) => ({
    userId,
    type: NotificationType.SYSTEM,
    title: "Đơn đăng ký được phê duyệt",
    message: `Chúc mừng! Đơn đăng ký của "${cinemaName}" đã được chấp thuận. Bạn có thể bắt đầu hoạt động.`,
    data: { cinemaName, broadcastType: "SUCCESS" },
  }),

  partnerRequestRejected: (userId: string, cinemaName: string, reason: string) => ({
    userId,
    type: NotificationType.SYSTEM,
    title: "Đơn đăng ký bị từ chối",
    message: `Đơn đăng ký của "${cinemaName}" chưa được chấp thuận. Lý do: ${reason}`,
    data: { cinemaName, reason, broadcastType: "WARNING" },
  }),

  newPartnerRequestAdmin: (adminUserId: string, cinemaName: string, requestId: string) => ({
    adminUserId,
    userId: adminUserId,
    type: NotificationType.SYSTEM,
    title: "Đơn đăng ký đối tác mới",
    message: `"${cinemaName}" vừa nộp đơn đăng ký trở thành đối tác.`,
    data: { cinemaName, requestId, broadcastType: "INFO" },
  }),

  partnerRequestReceived: (userId: string, cinemaName: string) => ({
    userId,
    type: NotificationType.SYSTEM,
    title: "Đã nhận đơn đăng ký",
    message: `Đơn đăng ký đối tác của "${cinemaName}" đã được ghi nhận. Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.`,
    data: { cinemaName, broadcastType: "SUCCESS" },
  }),
} as const;
