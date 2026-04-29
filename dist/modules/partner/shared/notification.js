"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerNotificationService = void 0;
const logger_1 = require("../../system/log/logger");
const notification_1 = require("../../notification");
class PartnerNotificationService {
    async sendWithdrawalPending(input) {
        logger_1.logger.info("[PartnerNotif] withdrawal.pending", {
            email: input.email,
            amount: input.amount,
            ref: input.reference,
        });
        if (input.userId) {
            await notification_1.pushNotificationService
                .send(notification_1.NotificationFactory.partnerWithdrawalPending(input.userId, input.reference, input.amount))
                .catch((err) => logger_1.logger.warn("[PartnerNotif] push failed", { err: err.message }));
        }
    }
    async sendWithdrawalCompleted(input) {
        logger_1.logger.info("[PartnerNotif] withdrawal.completed", {
            email: input.email,
            amount: input.amount,
            ref: input.reference,
        });
        if (input.userId) {
            await notification_1.pushNotificationService
                .send(notification_1.NotificationFactory.partnerWithdrawalCompleted(input.userId, input.reference, input.amount))
                .catch((err) => logger_1.logger.warn("[PartnerNotif] push failed", { err: err.message }));
        }
    }
    async sendWithdrawalFailed(input) {
        logger_1.logger.info("[PartnerNotif] withdrawal.failed", {
            email: input.email,
            amount: input.amount,
            reason: input.reason,
        });
        if (input.userId) {
            await notification_1.pushNotificationService
                .send(notification_1.NotificationFactory.partnerWithdrawalFailed(input.userId, "unknown", input.amount, input.reason))
                .catch((err) => logger_1.logger.warn("[PartnerNotif] push failed", { err: err.message }));
        }
    }
    async sendMovieApproved(input) {
        logger_1.logger.info("[PartnerNotif] movie.approved", {
            email: input.email,
            movie: input.movieTitle,
        });
        if (input.userId) {
            await notification_1.pushNotificationService
                .send(notification_1.NotificationFactory.partnerMovieApproved(input.userId, input.movieId ?? "", input.movieTitle))
                .catch((err) => logger_1.logger.warn("[PartnerNotif] push failed", { err: err.message }));
        }
    }
    async sendMovieRejected(input) {
        logger_1.logger.info("[PartnerNotif] movie.rejected", {
            email: input.email,
            movie: input.movieTitle,
            reason: input.reason,
        });
        if (input.userId) {
            await notification_1.pushNotificationService
                .send(notification_1.NotificationFactory.partnerMovieRejected(input.userId, input.movieId ?? "", input.movieTitle, input.reason))
                .catch((err) => logger_1.logger.warn("[PartnerNotif] push failed", { err: err.message }));
        }
    }
    async sendDailyRevenue(input) {
        logger_1.logger.info("[PartnerNotif] daily.revenue", {
            email: input.email,
            date: input.date,
            revenue: input.revenue,
        });
        if (input.userId) {
            await notification_1.pushNotificationService
                .send(notification_1.NotificationFactory.system(input.userId, "Báo cáo doanh thu hôm nay", `Doanh thu ngày ${input.date}: ${input.revenue.toLocaleString("vi-VN")} VND`, { revenue: input.revenue, date: input.date }))
                .catch((err) => logger_1.logger.warn("[PartnerNotif] push failed", { err: err.message }));
        }
    }
}
exports.PartnerNotificationService = PartnerNotificationService;
