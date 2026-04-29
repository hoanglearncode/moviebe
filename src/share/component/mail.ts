import nodemailer, { Transporter } from "nodemailer";
import { ENV } from "../common/value";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export class MailService {
  private transporter?: Transporter;

  async send(input: SendMailInput): Promise<void> {
    const transporter = this.getTransporter();

    await transporter.sendMail({
      from: this.getFromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    if (!ENV.SMTP_HOST || !ENV.SMTP_USER || !ENV.SMTP_PASS || !ENV.MAIL_FROM_EMAIL) {
      throw new Error(
        "Mail service is not configured. Please set SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM_EMAIL.",
      );
    }

    this.transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_SECURE,
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
      },
    });

    return this.transporter;
  }

  private getFromAddress(): string {
    if (!ENV.MAIL_FROM_EMAIL) {
      throw new Error("MAIL_FROM_EMAIL is not configured.");
    }

    return `${ENV.MAIL_FROM_NAME} <${ENV.MAIL_FROM_EMAIL}>`;
  }
}

export const mailService = new MailService();
