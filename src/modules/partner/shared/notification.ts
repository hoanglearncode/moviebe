import { IPartnerNotificationService } from "../interface";
import { logger } from "../../system/log/logger";
import { pushNotificationService, NotificationFactory } from "../../notification";

/**
 * PartnerNotificationService
 *
 * Kết hợp hai kênh:
 *  1. Logger / email (TODO: thay bằng mailService khi tích hợp)
 *  2. In-app push notification qua PushNotificationService → BullMQ → Pusher
 *
 * Nếu `userId` không được truyền vào, chỉ log — không gửi push.
 */
export class PartnerNotificationService implements IPartnerNotificationService {
  async sendWithdrawalPending(input: {
    userId?: string;
    email: string;
    amount: number;
    reference: string;
  }): Promise<void> {
    logger.info("[PartnerNotif] withdrawal.pending", {
      email: input.email,
      amount: input.amount,
      ref: input.reference,
    });
    // TODO: await mailService.send(input.email, "Withdrawal Initiated", ...)

    if (input.userId) {
      await pushNotificationService
        .send(
          NotificationFactory.partnerWithdrawalPending(input.userId, input.reference, input.amount),
        )
        .catch((err) => logger.warn("[PartnerNotif] push failed", { err: err.message }));
    }
  }

  async sendWithdrawalCompleted(input: {
    userId?: string;
    email: string;
    amount: number;
    reference: string;
  }): Promise<void> {
    logger.info("[PartnerNotif] withdrawal.completed", {
      email: input.email,
      amount: input.amount,
      ref: input.reference,
    });
    // TODO: await mailService.send(input.email, "Withdrawal Completed", ...)

    if (input.userId) {
      await pushNotificationService
        .send(
          NotificationFactory.partnerWithdrawalCompleted(
            input.userId,
            input.reference,
            input.amount,
          ),
        )
        .catch((err) => logger.warn("[PartnerNotif] push failed", { err: err.message }));
    }
  }

  async sendWithdrawalFailed(input: {
    userId?: string;
    email: string;
    amount: number;
    reason: string;
  }): Promise<void> {
    logger.info("[PartnerNotif] withdrawal.failed", {
      email: input.email,
      amount: input.amount,
      reason: input.reason,
    });
    // TODO: await mailService.send(input.email, "Withdrawal Failed", ...)

    if (input.userId) {
      await pushNotificationService
        .send(
          NotificationFactory.partnerWithdrawalFailed(
            input.userId,
            "unknown",
            input.amount,
            input.reason,
          ),
        )
        .catch((err) => logger.warn("[PartnerNotif] push failed", { err: err.message }));
    }
  }

  async sendMovieApproved(input: {
    userId?: string;
    email: string;
    movieTitle: string;
    movieId?: string;
  }): Promise<void> {
    logger.info("[PartnerNotif] movie.approved", {
      email: input.email,
      movie: input.movieTitle,
    });
    // TODO: await mailService.send(input.email, "Movie Approved", ...)

    if (input.userId) {
      await pushNotificationService
        .send(
          NotificationFactory.partnerMovieApproved(
            input.userId,
            input.movieId ?? "",
            input.movieTitle,
          ),
        )
        .catch((err) => logger.warn("[PartnerNotif] push failed", { err: err.message }));
    }
  }

  async sendMovieRejected(input: {
    userId?: string;
    email: string;
    movieTitle: string;
    movieId?: string;
    reason: string;
  }): Promise<void> {
    logger.info("[PartnerNotif] movie.rejected", {
      email: input.email,
      movie: input.movieTitle,
      reason: input.reason,
    });
    // TODO: await mailService.send(input.email, "Movie Rejected", ...)

    if (input.userId) {
      await pushNotificationService
        .send(
          NotificationFactory.partnerMovieRejected(
            input.userId,
            input.movieId ?? "",
            input.movieTitle,
            input.reason,
          ),
        )
        .catch((err) => logger.warn("[PartnerNotif] push failed", { err: err.message }));
    }
  }

  async sendDailyRevenue(input: {
    userId?: string;
    email: string;
    revenue: number;
    date: string;
  }): Promise<void> {
    logger.info("[PartnerNotif] daily.revenue", {
      email: input.email,
      date: input.date,
      revenue: input.revenue,
    });
    // TODO: await mailService.send(input.email, "Daily Revenue Report", ...)

    if (input.userId) {
      await pushNotificationService
        .send(
          NotificationFactory.system(
            input.userId,
            "Báo cáo doanh thu hôm nay",
            `Doanh thu ngày ${input.date}: ${input.revenue.toLocaleString("vi-VN")} VND`,
            { revenue: input.revenue, date: input.date },
          ),
        )
        .catch((err) => logger.warn("[PartnerNotif] push failed", { err: err.message }));
    }
  }
}
