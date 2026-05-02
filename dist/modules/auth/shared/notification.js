import { ENV } from "@/share/common/value";
import { mailService } from "@/share/component/mail";
import { enqueueEmailJob, isQueueEnabled } from "@/queue";
import { logger } from "@/modules/system/log/logger";
import { PrismaClient, EmailNotificationEvent } from "@prisma/client";
const prisma = new PrismaClient();
export class AuthNotificationService {
    constructor(emailService = mailService) {
        this.emailService = emailService;
    }
    async sendVerifyEmail(input) {
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
    async sendWellComeEmail(email) {
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
    async sendResetPasswordEmail(input) {
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
    async sendChangePasswordEmail(email) {
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
    async getTemplate(event) {
        const template = await prisma.emailTemplate.findUnique({
            where: { event },
        });
        if (!template || !template.isActive) {
            throw new Error(`Email template not found or inactive: ${event}`);
        }
        return template;
    }
    render(template, variables) {
        let result = template;
        for (const key in variables) {
            const value = variables[key] ?? "";
            result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
        }
        return result;
    }
    async dispatchEmail(input) {
        if (!isQueueEnabled) {
            await this.emailService.send(input);
            return;
        }
        try {
            await enqueueEmailJob(input, {
                jobId: `mail:${input.to}:${Date.now()}`,
            });
        }
        catch (error) {
            logger.warn("Queue email dispatch failed, falling back to direct mail send", {
                to: input.to,
                error: error.message,
            });
            await this.emailService.send(input);
        }
    }
}
