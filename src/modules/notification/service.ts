import { EmailNotificationEvent, EmailTemplate } from "@prisma/client";
import { enqueueEmailJob } from "../../queue/config/email.queue";
import { logger } from "../system/log/logger";
import { EmailNotificationEventType, EmailNotificationPayload } from "./types";
import { IEmailTemplateRepository, IScheduledEmailRepository } from "./repository";

/**
 * Email Notification Service
 *
 * Giúp dễ hiểu:
 * ─────────────────────────────────────────────────────────────────────
 * - Quản lý việc gửi email thông báo cho người dùng
 * - Khi có sự kiện (ví dụ: tạo tài khoản, đổi mật khẩu), gọi hàm tương ứng
 * - Service tìm template trong DB, thay thế biến ({{name}}, {{email}}, v.v.)
 * - Đưa vào hàng đợi (Redis Queue) để xử lý bất đồng bộ
 * - Worker sẽ lấy từ hàng đợi và gửi email
 *
 * Quy trình:
 * ─────────────────────────────────────────────────────────────────────
 * 1. Sự kiện xảy ra (ví dụ: User tạo tài khoản)
 *        ↓
 * 2. Gọi service → sendWelcomeEmail({ email, name })
 *        ↓
 * 3. Service lấy template "WELCOME_NEW_ACCOUNT" từ DB
 *        ↓
 * 4. Thay thế biến: {{name}} → "Nguyễn Văn A"
 *        ↓
 * 5. Thêm công việc vào hàng đợi (Redis)
 *        ↓
 * 6. Worker lấy công việc từ hàng đợi
 *        ↓
 * 7. Gửi email qua Nodemailer
 *        ↓
 * 8. Cập nhật trạng thái: SENT or FAILED
 * ─────────────────────────────────────────────────────────────────────
 */

export class EmailNotificationService {
  constructor(
    private templateRepo: IEmailTemplateRepository,
    private scheduledEmailRepo: IScheduledEmailRepository,
  ) {}

  /**
   * Helper: Thay thế biến trong template
   * Ví dụ: "Chào {{name}}, email của bạn là {{email}}"
   *        với { name: "John", email: "john@example.com" }
   *        → "Chào John, email của bạn là john@example.com"
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
   * Helper: Lấy template từ DB và thay thế biến
   */
  private async getAndProcessTemplate(
    event: EmailNotificationEvent,
    variables: Record<string, any>,
  ): Promise<{ subject: string; body: string } | null> {
    const template = await this.templateRepo.getTemplateByEvent(event);
    if (!template) {
      logger.warn(`Email template not found for event: ${event}`);
      return null;
    }

    return {
      subject: this.replaceVariables(template.subject, variables),
      body: this.replaceVariables(template.body, variables),
    };
  }

  /**
   * Helper: Thêm email vào hàng đợi
   */
  private async enqueueEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await enqueueEmailJob({
        to,
        subject,
        html,
        text: html, // Có thể cải thiện: chuyển HTML sang plaintext
      });
      logger.info(`Email queued successfully`, { to, subject });
    } catch (error) {
      logger.error(`Failed to queue email`, { to, subject, error });
      throw error;
    }
  }

  /**
   * 1️⃣ Welcome Email - Khi tài khoản mới được tạo (Admin tạo hoặc đăng ký)
   */
  async sendWelcomeEmail(payload: { email: string; name?: string }): Promise<void> {
    const processed = await this.getAndProcessTemplate(EmailNotificationEvent.WELCOME_NEW_ACCOUNT, {
      name: payload.name || payload.email,
      email: payload.email,
    });

    if (!processed) return;

    await this.enqueueEmail(payload.email, processed.subject, processed.body);
  }

  /**
   * 2️⃣ Welcome Email - Khi tài khoản được tạo qua Social Login (Google, Facebook, v.v.)
   */
  async sendWelcomeSocialLoginEmail(payload: {
    email: string;
    name?: string;
    provider?: string;
  }): Promise<void> {
    const processed = await this.getAndProcessTemplate(
      EmailNotificationEvent.WELCOME_SOCIAL_LOGIN,
      {
        name: payload.name || payload.email,
        email: payload.email,
        provider: payload.provider || "Social Login",
      },
    );

    if (!processed) return;

    await this.enqueueEmail(payload.email, processed.subject, processed.body);
  }

  /**
   * 3️⃣ Account Updated - Khi Admin cập nhật thông tin tài khoản người dùng
   */
  async sendAccountUpdatedEmail(payload: {
    email: string;
    name?: string;
    changes?: string[];
  }): Promise<void> {
    const processed = await this.getAndProcessTemplate(
      EmailNotificationEvent.ACCOUNT_UPDATED_BY_ADMIN,
      {
        name: payload.name || payload.email,
        email: payload.email,
        changes: payload.changes?.join(", ") || "Account information",
      },
    );

    if (!processed) return;

    await this.enqueueEmail(payload.email, processed.subject, processed.body);
  }

  /**
   * 4️⃣ Password Changed - Khi người dùng đổi mật khẩu
   */
  async sendPasswordChangeEmail(payload: { email: string; name?: string }): Promise<void> {
    const processed = await this.getAndProcessTemplate(EmailNotificationEvent.PASSWORD_CHANGED, {
      name: payload.name || payload.email,
      email: payload.email,
    });

    if (!processed) return;

    await this.enqueueEmail(payload.email, processed.subject, processed.body);
  }

  /**
   * 5️⃣ Account Deleted - Khi người dùng xoá tài khoản
   */
  async sendAccountDeletedEmail(payload: { email: string; name?: string }): Promise<void> {
    const processed = await this.getAndProcessTemplate(EmailNotificationEvent.ACCOUNT_DELETED, {
      name: payload.name || payload.email,
      email: payload.email,
    });

    if (!processed) return;

    await this.enqueueEmail(payload.email, processed.subject, processed.body);
  }

  /**
   * 6️⃣ Login Warning - Cảnh báo đăng nhập từ thiết bị/địa điểm mới
   */
  async sendLoginWarningEmail(payload: {
    email: string;
    name?: string;
    device?: string;
    ip?: string;
    time?: string;
  }): Promise<void> {
    const processed = await this.getAndProcessTemplate(EmailNotificationEvent.LOGIN_WARNING, {
      name: payload.name || payload.email,
      email: payload.email,
      device: payload.device || "Unknown Device",
      ip: payload.ip || "Unknown IP",
      time: payload.time || new Date().toISOString(),
    });

    if (!processed) return;

    await this.enqueueEmail(payload.email, processed.subject, processed.body);
  }

  /**
   * 7️⃣ Promotional Campaign - Gửi khuyến mãi cho người dùng
   * (Admin lên lịch từ Admin Panel)
   */
  async sendPromoCampaignEmail(payload: {
    email: string;
    name?: string;
    promotionDetail?: string;
  }): Promise<void> {
    const processed = await this.getAndProcessTemplate(EmailNotificationEvent.PROMO_CAMPAIGN, {
      name: payload.name || payload.email,
      email: payload.email,
      promotion_detail: payload.promotionDetail || "Special offer available",
    });

    if (!processed) return;

    await this.enqueueEmail(payload.email, processed.subject, processed.body);
  }

  /**
   * 8️⃣ Schedule Email - Admin lên lịch gửi email cho người dùng cụ thể
   * (với độ trễ, được lưu trong DB)
   */
  async scheduleEmailForUser(payload: {
    userId: string;
    email: string;
    subject: string;
    body: string;
    scheduledFor?: Date; // Thời gian gửi, nếu null thì gửi ngay
  }): Promise<void> {
    await this.scheduledEmailRepo.scheduleEmail({
      userId: payload.userId,
      email: payload.email,
      templateId: "",
      subject: payload.subject,
      body: payload.body,
      variables: null,
      failedReason: null,
      status: "PENDING",
      scheduledFor: payload.scheduledFor || new Date(),
    } as any);

    logger.info(`Email scheduled`, { userId: payload.userId, email: payload.email });
  }
}
