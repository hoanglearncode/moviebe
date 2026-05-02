import { logger } from "@/modules/system/log/logger";
import { pushNotificationService, NotificationFactory } from "@/modules/notification";
export class PartnerNotificationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Look up the partner setting row via the userId → Partner → PartnerSetting join.
     * Returns null when Prisma is not available (backwards-compat) or partner has no setting row
     * (treated as all-defaults = all enabled).
     */
    async getPartnerSetting(userId) {
        if (!this.prisma)
            return null;
        const partner = await this.prisma.partner
            .findUnique({ where: { userId }, select: { setting: true } })
            .catch(() => null);
        return partner?.setting ?? null;
    }
    async sendWithdrawalPending(input) {
        logger.info("[PartnerNotif] withdrawal.pending", {
            email: input.email,
            amount: input.amount,
            ref: input.reference,
        });
        if (!input.userId)
            return;
        const setting = await this.getPartnerSetting(input.userId);
        if (setting && !setting.notifyWithdrawal) {
            logger.debug("[PartnerNotif] withdrawal.pending skipped — partner opted out", {
                userId: input.userId,
            });
            return;
        }
        await pushNotificationService
            .send(NotificationFactory.partnerWithdrawalPending(input.userId, input.reference, input.amount))
            .catch((err) => logger.warn("[PartnerNotif] push failed", { err: err.message }));
    }
    async sendWithdrawalCompleted(input) {
        logger.info("[PartnerNotif] withdrawal.completed", {
            email: input.email,
            amount: input.amount,
            ref: input.reference,
        });
        if (!input.userId)
            return;
        const setting = await this.getPartnerSetting(input.userId);
        if (setting && !setting.notifyWithdrawal) {
            logger.debug("[PartnerNotif] withdrawal.completed skipped — partner opted out", {
                userId: input.userId,
            });
            return;
        }
        await pushNotificationService
            .send(NotificationFactory.partnerWithdrawalCompleted(input.userId, input.reference, input.amount))
            .catch((err) => logger.warn("[PartnerNotif] push failed", { err: err.message }));
    }
    async sendWithdrawalFailed(input) {
        logger.info("[PartnerNotif] withdrawal.failed", {
            email: input.email,
            amount: input.amount,
            reason: input.reason,
        });
        if (!input.userId)
            return;
        // Withdrawal failure is always delivered — partner needs to know about failures
        // regardless of their preference so they can take action.
        await pushNotificationService
            .send(NotificationFactory.partnerWithdrawalFailed(input.userId, "unknown", input.amount, input.reason))
            .catch((err) => logger.warn("[PartnerNotif] push failed", { err: err.message }));
    }
    async sendMovieApproved(input) {
        logger.info("[PartnerNotif] movie.approved", { email: input.email, movie: input.movieTitle });
        if (!input.userId)
            return;
        const setting = await this.getPartnerSetting(input.userId);
        if (setting && !setting.notifyMovieStatus) {
            logger.debug("[PartnerNotif] movie.approved skipped — partner opted out", {
                userId: input.userId,
            });
            return;
        }
        await pushNotificationService
            .send(NotificationFactory.partnerMovieApproved(input.userId, input.movieId ?? "", input.movieTitle))
            .catch((err) => logger.warn("[PartnerNotif] push failed", { err: err.message }));
    }
    async sendMovieRejected(input) {
        logger.info("[PartnerNotif] movie.rejected", {
            email: input.email,
            movie: input.movieTitle,
            reason: input.reason,
        });
        if (!input.userId)
            return;
        // Rejections are always delivered — partner must know their movie was rejected.
        await pushNotificationService
            .send(NotificationFactory.partnerMovieRejected(input.userId, input.movieId ?? "", input.movieTitle, input.reason))
            .catch((err) => logger.warn("[PartnerNotif] push failed", { err: err.message }));
    }
    async sendDailyRevenue(input) {
        logger.info("[PartnerNotif] daily.revenue", {
            email: input.email,
            date: input.date,
            revenue: input.revenue,
        });
        if (!input.userId)
            return;
        const setting = await this.getPartnerSetting(input.userId);
        if (setting && !setting.notifyRevenueReport) {
            logger.debug("[PartnerNotif] daily.revenue skipped — partner opted out", {
                userId: input.userId,
            });
            return;
        }
        await pushNotificationService
            .send(NotificationFactory.system(input.userId, "Báo cáo doanh thu hôm nay", `Doanh thu ngày ${input.date}: ${input.revenue.toLocaleString("vi-VN")} VND`, { revenue: input.revenue, date: input.date }))
            .catch((err) => logger.warn("[PartnerNotif] push failed", { err: err.message }));
    }
}
