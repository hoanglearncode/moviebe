"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationFactory = exports.pushNotificationService = exports.PushNotificationService = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_1 = require("../../../share/component/prisma");
const notification_queue_1 = require("../../../queue/config/notification.queue");
const logger_1 = require("../../system/log/logger");
/**
 * PushNotificationService
 *
 * Flow:
 *   send() → insert DB record → enqueue BullMQ job
 *   notification.worker → PusherService.pushToUser() → FE receives 'notification.new'
 */
class PushNotificationService {
    /**
     * Create a persistent notification and enqueue the Pusher push.
     */
    async send(input) {
        const { userId, type, title, message, data } = input;
        // 1. Persist notification
        const notification = await prisma_1.prisma.notification.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                userId,
                type,
                title,
                message,
                data: (data ?? {}),
                isRead: false,
            },
        });
        // 2. Enqueue for async Pusher delivery
        await (0, notification_queue_1.enqueueNotificationJob)({
            notificationId: notification.id,
            userId,
            type,
            title,
            message,
            data,
            traceId: (0, crypto_1.randomUUID)(),
        }).catch((err) => {
            // Queue unavailable (Redis down, etc.) — notification is persisted; push won't arrive realtime
            logger_1.logger.warn("[PushNotification] Enqueue failed, notification saved but push delayed", {
                notificationId: notification.id,
                error: err.message,
            });
        });
    }
    /**
     * List a user's notifications with pagination.
     */
    async list(userId, query = {}) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (query.onlyUnread)
            where.isRead = false;
        const [items, total, unreadCount] = await Promise.all([
            prisma_1.prisma.notification.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma_1.prisma.notification.count({ where }),
            prisma_1.prisma.notification.count({ where: { userId, isRead: false } }),
        ]);
        return { items, total, unreadCount };
    }
    /**
     * Mark a single notification as read.
     */
    async markRead(notificationId, userId) {
        await prisma_1.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true, readAt: new Date() },
        });
    }
    /**
     * Mark all of a user's notifications as read.
     */
    async markAllRead(userId) {
        const result = await prisma_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
        return { updated: result.count };
    }
    /**
     * Delete a single notification.
     */
    async delete(notificationId, userId) {
        await prisma_1.prisma.notification.deleteMany({
            where: { id: notificationId, userId },
        });
    }
    /**
     * Unread count only — lightweight for polling badges.
     */
    async unreadCount(userId) {
        const count = await prisma_1.prisma.notification.count({ where: { userId, isRead: false } });
        return { count };
    }
}
exports.PushNotificationService = PushNotificationService;
// Singleton — reuse across modules
exports.pushNotificationService = new PushNotificationService();
// ── Domain helper factories ───────────────────────────────────────────────────
// Use these for type-safe notification creation throughout the codebase.
exports.NotificationFactory = {
    partnerWithdrawalPending: (userId, withdrawalId, amount) => ({
        userId,
        type: client_1.NotificationType.PARTNER_WITHDRAWAL_PENDING,
        title: "Yêu cầu rút tiền đang chờ xử lý",
        message: `Yêu cầu rút ${amount.toLocaleString("vi-VN")} VND đang được xử lý.`,
        data: { withdrawalId, amount },
    }),
    partnerWithdrawalCompleted: (userId, withdrawalId, amount) => ({
        userId,
        type: client_1.NotificationType.PARTNER_WITHDRAWAL_COMPLETED,
        title: "Rút tiền thành công",
        message: `${amount.toLocaleString("vi-VN")} VND đã được chuyển vào tài khoản của bạn.`,
        data: { withdrawalId, amount },
    }),
    partnerWithdrawalFailed: (userId, withdrawalId, amount, reason) => ({
        userId,
        type: client_1.NotificationType.PARTNER_WITHDRAWAL_FAILED,
        title: "Rút tiền thất bại",
        message: `Yêu cầu rút ${amount.toLocaleString("vi-VN")} VND thất bại: ${reason}`,
        data: { withdrawalId, amount, reason },
    }),
    partnerMovieApproved: (userId, movieId, title) => ({
        userId,
        type: client_1.NotificationType.PARTNER_MOVIE_APPROVED,
        title: "Phim đã được duyệt",
        message: `Phim "${title}" đã được admin phê duyệt và sẵn sàng lên lịch.`,
        data: { movieId, title },
    }),
    partnerMovieRejected: (userId, movieId, title, reason) => ({
        userId,
        type: client_1.NotificationType.PARTNER_MOVIE_REJECTED,
        title: "Phim bị từ chối",
        message: `Phim "${title}" bị từ chối. Lý do: ${reason}`,
        data: { movieId, title, reason },
    }),
    showtimeCancelled: (userId, showtimeId, movieTitle, refundedTickets) => ({
        userId,
        type: client_1.NotificationType.SHOWTIME_CANCELLED,
        title: "Suất chiếu đã bị hủy",
        message: `Suất chiếu phim "${movieTitle}" đã bị hủy. ${refundedTickets} vé đã được hoàn tiền.`,
        data: { showtimeId, movieTitle, refundedTickets },
    }),
    bookingConfirmed: (userId, bookingId, movieTitle, showtime) => ({
        userId,
        type: client_1.NotificationType.BOOKING_CONFIRMED,
        title: "Đặt vé thành công",
        message: `Bạn đã đặt vé xem "${movieTitle}" lúc ${showtime}.`,
        data: { bookingId, movieTitle, showtime },
    }),
    ticketRefunded: (userId, ticketId, amount) => ({
        userId,
        type: client_1.NotificationType.TICKET_REFUNDED,
        title: "Hoàn tiền vé",
        message: `${amount.toLocaleString("vi-VN")} VND đã được hoàn về ví của bạn.`,
        data: { ticketId, amount },
    }),
    system: (userId, title, message, data) => ({
        userId,
        type: client_1.NotificationType.SYSTEM,
        title,
        message,
        data: data ?? {},
    }),
};
