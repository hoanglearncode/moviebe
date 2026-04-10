import { IUserNotificationService } from "../interface";

/**
 * UserNotificationService — stub implementation
 *
 * NOTE: Đây là "adapter" trong hexagonal architecture.
 * Hiện tại chỉ log ra console. Sau này thay bằng SendGrid, SES, etc.
 * mà không cần sửa gì ở usecase — đó là sức mạnh của hexagonal.
 */
export class UserNotificationService implements IUserNotificationService {
  async sendPasswordChangeConfirmation(input: { email: string; name: string }) {
    console.log(`[EMAIL] Password changed: ${input.email}`);
    // TODO: integrate với email provider (SendGrid, AWS SES, etc.)
  }

  async sendAccountDeletedNotification(input: { email: string; name: string }) {
    console.log(`[EMAIL] Account deleted: ${input.email}`);
  }

  async sendPasswordResetNotification(input: { email: string; token: string }) {
    console.log(`[EMAIL] Password reset for: ${input.email}`);
  }

  async sendWelcomeEmail(input: { email: string; name: string }) {
    console.log(`[EMAIL] Welcome email to: ${input.email}`);
  }
}