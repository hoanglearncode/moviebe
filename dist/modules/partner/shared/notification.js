"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerNotificationService = void 0;
const logger_1 = require("../../../../share/component/logger");
/**
 * Partner Notification Service
 * Handles sending notifications for partner events
 * (Email, SMS, In-app notifications)
 */
class PartnerNotificationService {
    /**
     * Send withdrawal pending notification
     * @param partnerId Partner ID
     * @param withdrawalId Withdrawal ID
     * @param amount Withdrawal amount
     */
    async sendWithdrawalPending(partnerId, withdrawalId, amount) {
        try {
            // TODO: Implement email notification
            logger_1.logger.info(`[NOTIFICATION] Withdrawal ${withdrawalId} initiated for partner ${partnerId}. Amount: ${amount}`);
            // Example: await mailService.send(partner.email, 'Withdrawal Initiated', ...)
        }
        catch (error) {
            logger_1.logger.error(`Failed to send withdrawal pending notification: ${error}`);
            // Don't throw - notification failures shouldn't block main operation
        }
    }
    /**
     * Send withdrawal completed notification
     * @param partnerId Partner ID
     * @param withdrawalId Withdrawal ID
     * @param amount Withdrawal amount
     */
    async sendWithdrawalCompleted(partnerId, withdrawalId, amount) {
        try {
            // TODO: Implement email notification
            logger_1.logger.info(`[NOTIFICATION] Withdrawal ${withdrawalId} completed for partner ${partnerId}. Amount: ${amount}`);
            // Example: await mailService.send(partner.email, 'Withdrawal Completed', ...)
        }
        catch (error) {
            logger_1.logger.error(`Failed to send withdrawal completed notification: ${error}`);
        }
    }
    /**
     * Send movie approved notification
     * @param partnerId Partner ID
     * @param movieId Movie ID
     * @param movieTitle Movie title
     */
    async sendMovieApproved(partnerId, movieId, movieTitle) {
        try {
            // TODO: Implement email notification
            logger_1.logger.info(`[NOTIFICATION] Movie "${movieTitle}" (${movieId}) approved for partner ${partnerId}`);
            // Example: await mailService.send(partner.email, 'Movie Approved', ...)
        }
        catch (error) {
            logger_1.logger.error(`Failed to send movie approved notification: ${error}`);
        }
    }
    /**
     * Send movie rejected notification
     * @param partnerId Partner ID
     * @param movieId Movie ID
     * @param movieTitle Movie title
     * @param reason Rejection reason
     */
    async sendMovieRejected(partnerId, movieId, movieTitle, reason) {
        try {
            // TODO: Implement email notification
            logger_1.logger.info(`[NOTIFICATION] Movie "${movieTitle}" (${movieId}) rejected for partner ${partnerId}. Reason: ${reason}`);
            // Example: await mailService.send(partner.email, 'Movie Rejected', ...)
        }
        catch (error) {
            logger_1.logger.error(`Failed to send movie rejected notification: ${error}`);
        }
    }
    /**
     * Send daily revenue report
     * @param partnerId Partner ID
     * @param dailyRevenue Daily revenue amount
     * @param totalEarned Total earned amount
     */
    async sendDailyRevenueReport(partnerId, dailyRevenue, totalEarned) {
        try {
            // TODO: Implement email notification with daily report
            logger_1.logger.info(`[NOTIFICATION] Daily revenue report for partner ${partnerId}. Daily: ${dailyRevenue}, Total: ${totalEarned}`);
            // Example: await mailService.send(partner.email, 'Daily Revenue Report', ...)
        }
        catch (error) {
            logger_1.logger.error(`Failed to send daily revenue report: ${error}`);
        }
    }
    /**
     * Send showtime cancellation notification to customers
     * @param showtimeId Showtime ID
     * @param movieTitle Movie title
     * @param cancelledAt Cancellation timestamp
     */
    async sendShowtimeCancellationNotice(showtimeId, movieTitle, cancelledAt) {
        try {
            // TODO: Implement SMS/email notification to ticket holders
            logger_1.logger.info(`[NOTIFICATION] Showtime ${showtimeId} for "${movieTitle}" cancelled at ${cancelledAt}`);
            // Example: Find all ticket holders and notify them
        }
        catch (error) {
            logger_1.logger.error(`Failed to send showtime cancellation notice: ${error}`);
        }
    }
    /**
     * Send seat unavailable notification
     * @param partnerId Partner ID
     * @param showtimeId Showtime ID
     * @param seatCode Seat code (e.g., "A1")
     * @param reason Reason for unavailability
     */
    async sendSeatUnavailableNotification(partnerId, showtimeId, seatCode, reason) {
        try {
            // TODO: Implement notification
            logger_1.logger.info(`[NOTIFICATION] Seat ${seatCode} in showtime ${showtimeId} is now unavailable. Reason: ${reason}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to send seat unavailable notification: ${error}`);
        }
    }
}
exports.PartnerNotificationService = PartnerNotificationService;
