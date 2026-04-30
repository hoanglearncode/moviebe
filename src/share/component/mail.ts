import nodemailer, { Transporter } from "nodemailer";
import { ENV } from "@/share/common/value";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export class MailService {
  private transporter?: Transporter;
  private fromAddress?: string;

  async send(input: SendMailInput): Promise<void> {
    const transporter = await this.getTransporter();

    await transporter.sendMail({
      from: this.fromAddress,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  }

  /**
   * Clear cached transporter — called when admin updates SMTP settings so the
   * next send() call picks up the new config from SystemSettings.
   */
  invalidate(): void {
    this.transporter = undefined;
    this.fromAddress = undefined;
  }

  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) return this.transporter;

    // Try to load SMTP config from the SystemSettings DB (admin-configured).
    // Falls through to ENV when the service is not initialised (e.g., at test
    // time) or when no SMTP keys have been set in the DB yet.
    try {
      const { getSystemSettingsService } = await import("../../modules/admin-system-settings");
      const svc = getSystemSettingsService();
      const [host, port, user, pass, fromName, fromEmail] = await Promise.all([
        svc.get("smtpHost"),
        svc.get("smtpPort"),
        svc.get("smtpUser"),
        svc.get("smtpPassword"),
        svc.get("fromName"),
        svc.get("fromEmail"),
      ]);

      if (host && user && pass && fromEmail) {
        const portNum = parseInt(port, 10);
        this.transporter = nodemailer.createTransport({
          host,
          port: portNum,
          secure: portNum === 465,
          auth: { user, pass },
        });
        this.fromAddress = `${fromName} <${fromEmail}>`;
        return this.transporter;
      }
    } catch {
      // Service not initialised or SMTP not configured in DB — fall through
    }

    // Fallback: ENV vars
    if (!ENV.SMTP_HOST || !ENV.SMTP_USER || !ENV.SMTP_PASS || !ENV.MAIL_FROM_EMAIL) {
      throw new Error(
        "Mail service is not configured. Set SMTP settings in the admin panel or via ENV vars.",
      );
    }

    this.transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_SECURE,
      auth: { user: ENV.SMTP_USER, pass: ENV.SMTP_PASS },
    });
    this.fromAddress = `${ENV.MAIL_FROM_NAME} <${ENV.MAIL_FROM_EMAIL}>`;
    return this.transporter;
  }
}

export const mailService = new MailService();
