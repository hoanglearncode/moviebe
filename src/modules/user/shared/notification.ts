import { PrismaClient, EmailNotificationEvent } from "@prisma/client";
import { IUserNotificationService } from "../interface";
import { MailService, mailService } from "../../../share/component/mail";
import { enqueueEmailJob, isQueueEnabled } from "../../../queue";
import { logger } from "../../system/log/logger";
import { ENV } from "../../../share/common/value";

const prisma = new PrismaClient();

export class UserNotificationService implements IUserNotificationService {
  constructor(private readonly emailService: MailService = mailService) {}

  /**
   * 1. Password changed
   */
  async sendPasswordChangeConfirmation(input: { email: string; name: string }): Promise<void> {
    const template = await this.getTemplate(EmailNotificationEvent.PASSWORD_CHANGED);

    const html = this.render(template.body, {
      email: input.email,
      name: input.name || input.email,
    });

    const subject = this.render(template.subject, {
      email: input.email,
    });

    await this.dispatchEmail({
      to: input.email,
      subject,
      html,
      text: "Your password has been changed successfully.",
    });
  }

  /**
   * 2. Account deleted
   */
  async sendAccountDeletedNotification(input: { email: string; name: string }): Promise<void> {
    const template = await this.getTemplate(EmailNotificationEvent.ACCOUNT_DELETED);

    const html = this.render(template.body, {
      email: input.email,
      name: input.name || input.email,
    });

    const subject = this.render(template.subject, {
      email: input.email,
    });

    await this.dispatchEmail({
      to: input.email,
      subject,
      html,
      text: "Your account has been deleted.",
    });
  }

  /**
   * 3. Reset password (theo interface)
   */
  async sendPasswordResetNotification(input: { email: string; token: string }): Promise<void> {
    const resetUrl = `${ENV.FRONTEND_URL}/reset-password?token=${encodeURIComponent(input.token)}`;

    const template = await this.getTemplate(
      EmailNotificationEvent.RESET_PASSWORD, // ⚠️ dùng đúng template seed
    );

    const html = this.render(template.body, {
      email: input.email,
      name: input.email,
      reset_url: resetUrl,
      token: input.token,
    });

    const subject = this.render(template.subject, {
      email: input.email,
    });

    await this.dispatchEmail({
      to: input.email,
      subject,
      html,
      text: `Reset password: ${resetUrl}`,
    });
  }

  /**
   * 4. Welcome email
   */
  async sendWelcomeEmail(input: { email: string; name: string }): Promise<void> {
    const template = await this.getTemplate(EmailNotificationEvent.WELCOME_NEW_ACCOUNT);

    const html = this.render(template.body, {
      email: input.email,
      name: input.name || input.email,
    });

    const subject = this.render(template.subject, {
      email: input.email,
    });

    await this.dispatchEmail({
      to: input.email,
      subject,
      html,
      text: "Welcome to CinePass!",
    });
  }

  // ========================
  // SHARED METHODS (giữ giống AuthNotificationService)
  // ========================

  private async getTemplate(event: EmailNotificationEvent) {
    const template = await prisma.emailTemplate.findUnique({
      where: { event },
    });

    if (!template || !template.isActive) {
      throw new Error(`Email template not found or inactive: ${event}`);
    }

    return template;
  }

  private render(template: string, variables: Record<string, any>): string {
    let result = template;

    for (const key in variables) {
      const value = variables[key] ?? "";
      result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
    }

    return result;
  }

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
}
