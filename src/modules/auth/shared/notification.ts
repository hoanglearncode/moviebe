import { IAuthNotificationService } from "../interface";
import { ENV } from "../../../share/common/value";
import { MailService, mailService } from "../../../share/component/mail";
import { enqueueEmailJob, isQueueEnabled } from "../../../queue";
import { logger } from "../../system/log/logger";
import { PrismaClient, EmailNotificationEvent } from "@prisma/client";

const prisma = new PrismaClient();

export class AuthNotificationService implements IAuthNotificationService {
  constructor(private readonly emailService: MailService = mailService) {}

  async sendVerifyEmail(input: { email: string; token: string }): Promise<void> {
    const verifyUrl = `${ENV.FRONTEND_URL}/verify-email?token=${encodeURIComponent(input.token)}`;

    const template = await this.getTemplate(EmailNotificationEvent.VERIFY_EMAIL);

    const html = this.render(template.body, {
      email: input.email,
      name: input.email,
      verify_url: verifyUrl,
      token: input.token,
    });

    const subject = this.render(template.subject, {
      email: input.email,
    });

    await this.dispatchEmail({
      to: input.email,
      subject,
      html,
      text: `Verify email: ${verifyUrl}`,
    });
  }

  async sendWellComeEmail(email: string): Promise<void> {
    const template = await this.getTemplate(EmailNotificationEvent.WELCOME_NEW_ACCOUNT);

    const html = this.render(template.body, {
      email: email,
      name: email,
    });

    const subject = this.render(template.subject, {
      email: email,
    });

    await this.dispatchEmail({
      to: email,
      subject,
      html,
      text: "",
    });
  }

  async sendResetPasswordEmail(input: { email: string; token: string }): Promise<void> {
    const resetUrl = `${ENV.FRONTEND_URL}/reset-password?token=${encodeURIComponent(input.token)}`;

    const template = await this.getTemplate(EmailNotificationEvent.RESET_PASSWORD);

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

  async sendChangePasswordEmail(email: string): Promise<void> {

    const template = await this.getTemplate(EmailNotificationEvent.PASSWORD_CHANGED);

    const html = this.render(template.body, {
      email: email,
      name: email,
    });

    const subject = this.render(template.subject, {
      email: email,
    });

    await this.dispatchEmail({
      to: email,
      subject,
      html,
      text: `Change password`,
    });
  }
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
