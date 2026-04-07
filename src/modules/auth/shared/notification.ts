import { IAuthNotificationService } from "../interface";
import { ENV } from "../../../share/common/value";
import { MailService, mailService } from "../../../share/component/mail";

export class AuthNotificationService implements IAuthNotificationService {
  constructor(private readonly emailService: MailService = mailService) {}

  async sendVerifyEmail(input: { email: string; token: string }): Promise<void> {
    const verifyUrl = `${ENV.FRONTEND_URL}/verify-email?token=${encodeURIComponent(
      input.token
    )}`;

    await this.emailService.send({
      to: input.email,
      subject: "Verify your email address",
      html: this.renderTemplate({
        title: "Verify your email",
        intro:
          "Thanks for registering. Click the button below to verify your email address and activate your account.",
        actionLabel: "Verify email",
        actionUrl: verifyUrl,
        token: input.token,
      }),
      text: [
        "Verify your email address",
        "",
        `Open this link: ${verifyUrl}`,
        `Verification token: ${input.token}`,
      ].join("\n"),
    });
  }

  async sendResetPasswordEmail(input: { email: string; token: string }): Promise<void> {
    const resetUrl = `${ENV.FRONTEND_URL}/reset-password?token=${encodeURIComponent(
      input.token
    )}`;

    await this.emailService.send({
      to: input.email,
      subject: "Reset your password",
      html: this.renderTemplate({
        title: "Reset your password",
        intro:
          "We received a request to reset your password. Click the button below to continue.",
        actionLabel: "Reset password",
        actionUrl: resetUrl,
        token: input.token,
      }),
      text: [
        "Reset your password",
        "",
        `Open this link: ${resetUrl}`,
        `Reset token: ${input.token}`,
      ].join("\n"),
    });
  }

  private renderTemplate(input: {
    title: string;
    intro: string;
    actionLabel: string;
    actionUrl: string;
    token: string;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #111827;">
        <h1 style="margin-bottom: 16px; font-size: 24px;">${input.title}</h1>
        <p style="margin-bottom: 16px; line-height: 1.6;">${input.intro}</p>
        <p style="margin: 24px 0;">
          <a
            href="${input.actionUrl}"
            style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px;"
          >
            ${input.actionLabel}
          </a>
        </p>
        <p style="margin-bottom: 8px; line-height: 1.6;">If the button does not work, use this link:</p>
        <p style="margin-bottom: 16px; line-height: 1.6;">
          <a href="${input.actionUrl}">${input.actionUrl}</a>
        </p>
        <p style="margin-bottom: 8px; line-height: 1.6;">You can also use this token manually:</p>
        <pre style="background: #f3f4f6; padding: 12px; border-radius: 8px; overflow-x: auto;">${input.token}</pre>
      </div>
    `;
  }
}
