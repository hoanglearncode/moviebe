"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailNotificationService = void 0;
const client_1 = require("@prisma/client");
const email_queue_1 = require("../../../queue/config/email.queue");
const logger_1 = require("../../system/log/logger");
class EmailNotificationService {
    constructor(templateRepo, scheduledEmailRepo) {
        this.templateRepo = templateRepo;
        this.scheduledEmailRepo = scheduledEmailRepo;
    }
    replaceVariables(text, variables) {
        let result = text;
        Object.entries(variables).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            result = result.replace(new RegExp(placeholder, "g"), String(value || ""));
        });
        return result;
    }
    async getAndProcessTemplate(event, variables) {
        const template = await this.templateRepo.getTemplateByEvent(event);
        if (!template) {
            logger_1.logger.warn(`Email template not found for event: ${event}`);
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
    async enqueueEmail(to, subject, html) {
        try {
            await (0, email_queue_1.enqueueEmailJob)({
                to,
                subject,
                html,
                text: html,
            });
            logger_1.logger.info(`Email queued successfully`, { to, subject });
        }
        catch (error) {
            logger_1.logger.error(`Failed to queue email`, { to, subject, error });
            throw error;
        }
    }
    async sendWelcomeEmail(payload) {
        const processed = await this.getAndProcessTemplate(client_1.EmailNotificationEvent.WELCOME_NEW_ACCOUNT, {
            name: payload.name || payload.email,
            email: payload.email,
        });
        if (!processed)
            return;
        await this.enqueueEmail(payload.email, processed.subject, processed.body);
    }
    async sendWelcomeSocialLoginEmail(payload) {
        const processed = await this.getAndProcessTemplate(client_1.EmailNotificationEvent.WELCOME_SOCIAL_LOGIN, {
            name: payload.name || payload.email,
            email: payload.email,
            provider: payload.provider || "Social Login",
        });
        if (!processed)
            return;
        await this.enqueueEmail(payload.email, processed.subject, processed.body);
    }
    async sendAccountUpdatedEmail(payload) {
        const processed = await this.getAndProcessTemplate(client_1.EmailNotificationEvent.ACCOUNT_UPDATED_BY_ADMIN, {
            name: payload.name || payload.email,
            email: payload.email,
            changes: payload.changes?.join(", ") || "Account information",
        });
        if (!processed)
            return;
        await this.enqueueEmail(payload.email, processed.subject, processed.body);
    }
    /**
     * 4️⃣ Password Changed - Khi người dùng đổi mật khẩu
     */
    async sendPasswordChangeEmail(payload) {
        const processed = await this.getAndProcessTemplate(client_1.EmailNotificationEvent.PASSWORD_CHANGED, {
            name: payload.name || payload.email,
            email: payload.email,
        });
        if (!processed)
            return;
        await this.enqueueEmail(payload.email, processed.subject, processed.body);
    }
    /**
     * 5️⃣ Account Deleted - Khi người dùng xoá tài khoản
     */
    async sendAccountDeletedEmail(payload) {
        const processed = await this.getAndProcessTemplate(client_1.EmailNotificationEvent.ACCOUNT_DELETED, {
            name: payload.name || payload.email,
            email: payload.email,
        });
        if (!processed)
            return;
        await this.enqueueEmail(payload.email, processed.subject, processed.body);
    }
    /**
     * 6️⃣ Login Warning - Cảnh báo đăng nhập từ thiết bị/địa điểm mới
     */
    async sendLoginWarningEmail(payload) {
        const processed = await this.getAndProcessTemplate(client_1.EmailNotificationEvent.LOGIN_WARNING, {
            name: payload.name || payload.email,
            email: payload.email,
            device: payload.device || "Unknown Device",
            ip: payload.ip || "Unknown IP",
            time: payload.time || new Date().toISOString(),
        });
        if (!processed)
            return;
        await this.enqueueEmail(payload.email, processed.subject, processed.body);
    }
    /**
     * 7️⃣ Promotional Campaign - Gửi khuyến mãi cho người dùng
     * (Admin lên lịch từ Admin Panel)
     */
    async sendPromoCampaignEmail(payload) {
        const processed = await this.getAndProcessTemplate(client_1.EmailNotificationEvent.PROMO_CAMPAIGN, {
            name: payload.name || payload.email,
            email: payload.email,
            promotion_detail: payload.promotionDetail || "Special offer available",
        });
        if (!processed)
            return;
        await this.enqueueEmail(payload.email, processed.subject, processed.body);
    }
    /**
     * 8️⃣ Schedule Email - Admin lên lịch gửi email cho người dùng cụ thể
     * (với độ trễ, được lưu trong DB)
     */
    async scheduleEmailForUser(payload) {
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
        });
        logger_1.logger.info(`Email scheduled`, { userId: payload.userId, email: payload.email });
    }
}
exports.EmailNotificationService = EmailNotificationService;
