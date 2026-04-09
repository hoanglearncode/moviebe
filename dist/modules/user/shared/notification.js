"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNotificationService = void 0;
const logger_1 = require("../../system/log/logger");
/**
 * User Notification Service
 * Handles email notifications for user-related actions
 */
class UserNotificationService {
    async sendPasswordChangeConfirmation(input) {
        try {
            logger_1.logger.info(`[User Notification] Sending password change confirmation to ${input.email}`);
            // TODO: Implement email sending via nodemailer or AWS SES
            // await emailService.send({
            //   to: input.email,
            //   subject: "Password Changed Successfully",
            //   template: "password-changed",
            //   data: { name: input.name }
            // });
        }
        catch (error) {
            logger_1.logger.error("[User Notification] Error sending password change email:", error);
            throw error;
        }
    }
    async sendAccountDeletedNotification(input) {
        try {
            logger_1.logger.info(`[User Notification] Sending account deletion confirmation to ${input.email}`);
            // TODO: Implement email sending
            // await emailService.send({
            //   to: input.email,
            //   subject: "Your Account Has Been Deleted",
            //   template: "account-deleted",
            //   data: { name: input.name }
            // });
        }
        catch (error) {
            logger_1.logger.error("[User Notification] Error sending account deletion email:", error);
            throw error;
        }
    }
    async sendPasswordResetNotification(input) {
        try {
            logger_1.logger.info(`[User Notification] Sending password reset notification to ${input.email}`);
            // TODO: Implement email sending
            // const resetLink = `${process.env.APP_URL}/reset-password?token=${input.token}`;
            // await emailService.send({
            //   to: input.email,
            //   subject: "Your Password Has Been Reset",
            //   template: "password-reset",
            //   data: { tempPassword: input.token }
            // });
        }
        catch (error) {
            logger_1.logger.error("[User Notification] Error sending password reset email:", error);
            throw error;
        }
    }
    async sendWelcomeEmail(input) {
        try {
            logger_1.logger.info(`[User Notification] Sending welcome email to ${input.email}`);
            // TODO: Implement email sending
            // await emailService.send({
            //   to: input.email,
            //   subject: "Welcome to CinePass",
            //   template: "welcome",
            //   data: { name: input.name }
            // });
        }
        catch (error) {
            logger_1.logger.error("[User Notification] Error sending welcome email:", error);
            throw error;
        }
    }
}
exports.UserNotificationService = UserNotificationService;
