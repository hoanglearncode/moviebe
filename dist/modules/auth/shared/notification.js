"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthNotificationService = void 0;
const value_1 = require("../../../share/common/value");
const mail_1 = require("../../../share/component/mail");
const queue_1 = require("../../../queue");
const logger_1 = require("../../system/log/logger");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class AuthNotificationService {
    constructor(emailService = mail_1.mailService) {
        this.emailService = emailService;
    }
    async sendVerifyEmail(input) {
        const verifyUrl = `${value_1.ENV.FRONTEND_URL}/verify-email?token=${encodeURIComponent(input.token)}`;
        const template = await this.getTemplate(client_1.EmailNotificationEvent.VERIFY_EMAIL);
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
        const template = await this.getTemplate(client_1.EmailNotificationEvent.WELCOME_NEW_ACCOUNT);
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
        const resetUrl = `${value_1.ENV.FRONTEND_URL}/reset-password?token=${encodeURIComponent(input.token)}`;
        const template = await this.getTemplate(client_1.EmailNotificationEvent.RESET_PASSWORD);
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
        const template = await this.getTemplate(client_1.EmailNotificationEvent.PASSWORD_CHANGED);
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
}
exports.AuthNotificationService = AuthNotificationService;
