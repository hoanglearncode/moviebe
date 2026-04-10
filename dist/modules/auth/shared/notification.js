"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthNotificationService = void 0;
const value_1 = require("../../../share/common/value");
const mail_1 = require("../../../share/component/mail");
const queue_1 = require("../../../queue");
const logger_1 = require("../../system/log/logger");
class AuthNotificationService {
    constructor(emailService = mail_1.mailService) {
        this.emailService = emailService;
    }
    async sendVerifyEmail(input) {
        const verifyUrl = `${value_1.ENV.FRONTEND_URL}/verify-email?token=${encodeURIComponent(input.token)}`;
        await this.dispatchEmail({
            to: input.email,
            subject: "Verify your email address",
            html: this.renderTemplate({
                title: "Verify your email",
                intro: "Thanks for registering. Click the button below to verify your email address and activate your account.",
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
    async sendResetPasswordEmail(input) {
        const resetUrl = `${value_1.ENV.FRONTEND_URL}/reset-password?token=${encodeURIComponent(input.token)}`;
        await this.dispatchEmail({
            to: input.email,
            subject: "Reset your password",
            html: this.renderTemplate({
                title: "Reset your password",
                intro: "We received a request to reset your password. Click the button below to continue.",
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
    async dispatchEmail(input) {
        if (!queue_1.isQueueEnabled) {
            await this.emailService.send(input);
            return;
        }
        try {
            await (0, queue_1.enqueueEmailJob)(input, {
                jobId: `mail:${input.to}:${Date.now()}`,
            });
        }
        catch (error) {
            logger_1.logger.warn("Queue email dispatch failed, falling back to direct mail send", {
                to: input.to,
                error: error.message,
            });
            await this.emailService.send(input);
        }
    }
    renderTemplate(input) {
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
exports.AuthNotificationService = AuthNotificationService;
