"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNotificationService = void 0;
const client_1 = require("@prisma/client");
const mail_1 = require("../../../share/component/mail");
const queue_1 = require("../../../queue");
const logger_1 = require("../../system/log/logger");
const value_1 = require("../../../share/common/value");
const prisma = new client_1.PrismaClient();
class UserNotificationService {
    constructor(emailService = mail_1.mailService) {
        this.emailService = emailService;
    }
    /**
     * 1. Password changed
     */
    async sendPasswordChangeConfirmation(input) {
        const template = await this.getTemplate(client_1.EmailNotificationEvent.PASSWORD_CHANGED);
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
    async sendAccountDeletedNotification(input) {
        const template = await this.getTemplate(client_1.EmailNotificationEvent.ACCOUNT_DELETED);
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
    async sendPasswordResetNotification(input) {
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
    /**
     * 4. Welcome email
     */
    async sendWelcomeEmail(input) {
        const template = await this.getTemplate(client_1.EmailNotificationEvent.WELCOME_NEW_ACCOUNT);
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
exports.UserNotificationService = UserNotificationService;
