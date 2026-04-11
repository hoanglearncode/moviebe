import { PrismaClient, EmailNotificationEvent } from "@prisma/client";
import { IUserNotificationService } from "../interface";
import { MailService, mailService } from "../../../share/component/mail";
import { enqueueEmailJob, isQueueEnabled } from "../../../queue";
import { logger } from "../../system/log/logger";

/**
 * UserNotificationService — Production implementation
 *
 * Dùng template từ DB (EmailTemplate), replace variables, gửi qua queue hoặc sync
 * Flow:
 * 1. Event xảy ra (đổi mật khẩu, xóa tài khoản, v.v.)
 * 2. Tìm template từ DB by event type
 * 3. Replace {{variables}}
 * 4. Thêm vào queue (hoặc gửi trực tiếp nếu queue disabled)
 */
export class UserNotificationService implements IUserNotificationService {
  constructor(
    private prisma: PrismaClient,
    private emailService: MailService = mailService,
  ) {}

  /**
   * Helper: Thay thế biến trong template
   * E.g: "Chào {{name}}, {{email}}" + { name: "John", email: "john@..." }
   * → "Chào John, john@..."
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, "g"), String(value || ""));
    });
    return result;
  }

  /**
   * Helper: Lấy template từ DB theo event type và replace variables
   */
  private async getAndProcessTemplate(
    event: EmailNotificationEvent,
    variables: Record<string, any>,
  ): Promise<{ subject: string; body: string } | null> {
    try {
      const template = await this.prisma.emailTemplate.findUnique({
        where: { event },
      });

      if (!template) {
        logger.warn(`Email template not found for event: ${event}`);
        return null;
      }

      return {
        subject: this.replaceVariables(template.subject, variables),
        body: this.replaceVariables(template.body, variables),
      };
    } catch (error) {
      logger.error(`Failed to fetch template`, { event, error });
      return null;
    }
  }

  /**
   * Helper: Dispatch email qua queue hoặc sync
   * Giống cách AuthNotificationService làm
   */
  private async dispatchEmail(input: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    if (!isQueueEnabled) {
      await this.emailService.send(input);
      return;
    }

    try {
      await enqueueEmailJob(input, {
        jobId: `mail:${input.to}:${Date.now()}`,
      });
    } catch (error) {
      logger.warn("Queue email dispatch failed, falling back to direct mail send", {
        to: input.to,
        error: (error as Error).message,
      });

      await this.emailService.send(input);
    }
  }

  /**
   * Password Changed - Khi người dùng đổi mật khẩu
   */
  async sendPasswordChangeConfirmation(input: { email: string; name: string }): Promise<void> {
    const processed = await this.getAndProcessTemplate(EmailNotificationEvent.PASSWORD_CHANGED, {
      name: input.name || input.email,
      email: input.email,
    });

    if (!processed) {
      logger.warn(`Unable to send password change email: no template`, { email: input.email });
      return;
    }

    await this.dispatchEmail({
      to: input.email,
      subject: processed.subject,
      html: processed.body,
      text: processed.body, // có thể improve: convert HTML → plaintext
    });

    logger.info(`Password change confirmation queued`, { email: input.email });
  }

  /**
   * Account Deleted - Khi tài khoản bị xóa
   */
  async sendAccountDeletedNotification(input: { email: string; name: string }): Promise<void> {
    const processed = await this.getAndProcessTemplate(EmailNotificationEvent.ACCOUNT_DELETED, {
      name: input.name || input.email,
      email: input.email,
    });

    if (!processed) {
      logger.warn(`Unable to send account deleted email: no template`, { email: input.email });
      return;
    }

    await this.dispatchEmail({
      to: input.email,
      subject: processed.subject,
      html: processed.body,
      text: processed.body,
    });

    logger.info(`Account deleted notification queued`, { email: input.email });
  }

  /**
   * Password Reset - Khi request reset mật khẩu (stub - dùng AuthNotificationService)
   */
  async sendPasswordResetNotification(input: { email: string; token: string }): Promise<void> {
    logger.info(`[PASSWORD RESET] Token sent to: ${input.email}`);
    // Note: Hiện tại dùng AuthNotificationService (renderTemplate + token link)
    // UserNotificationService có thể dùng template từ DB sau
    // Nhưng reset password cần custom logic (tạo link + button), nên để AuthNotificationService xử lý
  }

  /**
   * Welcome Email - Khi tài khoản mới được tạo
   */
  async sendWelcomeEmail(input: { email: string; name: string }): Promise<void> {
    const processed = await this.getAndProcessTemplate(EmailNotificationEvent.WELCOME_NEW_ACCOUNT, {
      name: input.name || input.email,
      email: input.email,
    });

    if (!processed) {
      logger.warn(`Unable to send welcome email: no template`, { email: input.email });
      return;
    }

    await this.dispatchEmail({
      to: input.email,
      subject: processed.subject,
      html: processed.body,
      text: processed.body,
    });

    logger.info(`Welcome email queued`, { email: input.email });
  }
}
