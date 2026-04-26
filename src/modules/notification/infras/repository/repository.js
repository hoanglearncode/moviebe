"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledEmailRepository = exports.EmailTemplateRepository = void 0;
class EmailTemplateRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTemplateByEvent(event) {
        return this.prisma.emailTemplate.findUnique({
            where: { event, isActive: true },
        });
    }
    async getActiveTemplates() {
        return this.prisma.emailTemplate.findMany({
            where: { isActive: true },
        });
    }
    async getTemplateById(id) {
        return this.prisma.emailTemplate.findUnique({
            where: { id },
        });
    }
    async createTemplate(data) {
        return this.prisma.emailTemplate.create({
            data: {
                event: data.event,
                subject: data.subject,
                body: data.body,
                variables: data.variables,
                description: data.description,
                isActive: data.isActive ?? true,
            },
        });
    }
    async updateTemplate(id, data) {
        return this.prisma.emailTemplate.update({
            where: { id },
            data,
        });
    }
    async deleteTemplate(id) {
        const result = await this.prisma.emailTemplate.delete({
            where: { id },
        });
        return !!result.id;
    }
}
exports.EmailTemplateRepository = EmailTemplateRepository;
class ScheduledEmailRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async scheduleEmail(data) {
        return this.prisma.scheduledEmailNotification.create({
            data: {
                userId: data.userId,
                email: data.email,
                templateId: data.templateId,
                subject: data.subject,
                body: data.body,
                templateId: data.templateId,
                variables: (data.variables || undefined),
                failedReason: data.failedReason || undefined,
                status: data.status || "PENDING",
                scheduledFor: data.scheduledFor,
            },
        });
    }
    async getPendingEmails() {
        return this.prisma.scheduledEmailNotification.findMany({
            where: {
                status: "PENDING",
                OR: [
                    { scheduledFor: null }, // Immediate send
                    { scheduledFor: { lte: new Date() } }, // Time has come
                ],
            },
            orderBy: { createdAt: "asc" },
            take: 100, // Batch of 100 for processing
        });
    }
    async getScheduledEmails(userId) {
        return this.prisma.scheduledEmailNotification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    }
    async updateEmailStatus(id, status, failedReason) {
        return this.prisma.scheduledEmailNotification.update({
            where: { id },
            data: {
                status,
                failedReason,
                sentAt: status === "SENT" ? new Date() : undefined,
            },
        });
    }
    async deleteScheduledEmail(id) {
        const result = await this.prisma.scheduledEmailNotification.delete({
            where: { id },
        });
        return !!result.id;
    }
}
exports.ScheduledEmailRepository = ScheduledEmailRepository;
