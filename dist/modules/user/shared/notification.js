"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNotificationService = void 0;
/**
 * UserNotificationService — stub implementation
 *
 * NOTE: Đây là "adapter" trong hexagonal architecture.
 * Hiện tại chỉ log ra console. Sau này thay bằng SendGrid, SES, etc.
 * mà không cần sửa gì ở usecase — đó là sức mạnh của hexagonal.
 */
class UserNotificationService {
    async sendPasswordChangeConfirmation(input) {
        console.log(`[EMAIL] Password changed: ${input.email}`);
        // TODO: integrate với email provider (SendGrid, AWS SES, etc.)
    }
    async sendAccountDeletedNotification(input) {
        console.log(`[EMAIL] Account deleted: ${input.email}`);
    }
    async sendPasswordResetNotification(input) {
        console.log(`[EMAIL] Password reset for: ${input.email}`);
    }
    async sendWelcomeEmail(input) {
        console.log(`[EMAIL] Welcome email to: ${input.email}`);
    }
}
exports.UserNotificationService = UserNotificationService;
