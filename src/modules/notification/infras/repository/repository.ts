import {
  PrismaClient,
  EmailTemplate,
  ScheduledEmailNotification,
  EmailNotificationEvent,
} from "@prisma/client";

export interface IEmailTemplateRepository {
  getTemplateByEvent(event: EmailNotificationEvent): Promise<EmailTemplate | null>;
  getActiveTemplates(): Promise<EmailTemplate[]>;
  getTemplateById(id: string): Promise<EmailTemplate | null>;
  createTemplate(
    data: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">,
  ): Promise<EmailTemplate>;
  updateTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate>;
  deleteTemplate(id: string): Promise<boolean>;
}

export interface IScheduledEmailRepository {
  scheduleEmail(
    data: Omit<ScheduledEmailNotification, "id" | "createdAt" | "updatedAt">,
  ): Promise<ScheduledEmailNotification>;
  getPendingEmails(): Promise<ScheduledEmailNotification[]>;
  getScheduledEmails(userId: string): Promise<ScheduledEmailNotification[]>;
  updateEmailStatus(
    id: string,
    status: "SENT" | "FAILED",
    failedReason?: string,
  ): Promise<ScheduledEmailNotification>;
  deleteScheduledEmail(id: string): Promise<boolean>;
}

export class EmailTemplateRepository implements IEmailTemplateRepository {
  constructor(private prisma: PrismaClient) {}

  async getTemplateByEvent(event: EmailNotificationEvent): Promise<EmailTemplate | null> {
    return this.prisma.emailTemplate.findUnique({
      where: { event, isActive: true },
    });
  }

  async getActiveTemplates(): Promise<EmailTemplate[]> {
    return this.prisma.emailTemplate.findMany({
      where: { isActive: true },
    });
  }

  async getTemplateById(id: string): Promise<EmailTemplate | null> {
    return this.prisma.emailTemplate.findUnique({
      where: { id },
    });
  }

  async createTemplate(
    data: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">,
  ): Promise<EmailTemplate> {
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

  async updateTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    return this.prisma.emailTemplate.update({
      where: { id },
      data,
    });
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const result = await this.prisma.emailTemplate.delete({
      where: { id },
    });
    return !!result.id;
  }
}

export class ScheduledEmailRepository implements IScheduledEmailRepository {
  constructor(private prisma: PrismaClient) {}

  async scheduleEmail(
    data: Omit<ScheduledEmailNotification, "id" | "createdAt" | "updatedAt">,
  ): Promise<ScheduledEmailNotification> {
    return this.prisma.scheduledEmailNotification.create({
      data: {
        userId: data.userId,
        email: data.email,
        templateId: data.templateId,
        subject: data.subject,
        body: data.body,
        templateId: data.templateId,
        variables: (data.variables || undefined) as any,
        failedReason: data.failedReason || undefined,
        status: data.status || "PENDING",
        scheduledFor: data.scheduledFor,
      },
    });
  }

  async getPendingEmails(): Promise<ScheduledEmailNotification[]> {
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

  async getScheduledEmails(userId: string): Promise<ScheduledEmailNotification[]> {
    return this.prisma.scheduledEmailNotification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateEmailStatus(
    id: string,
    status: "SENT" | "FAILED",
    failedReason?: string,
  ): Promise<ScheduledEmailNotification> {
    return this.prisma.scheduledEmailNotification.update({
      where: { id },
      data: {
        status,
        failedReason,
        sentAt: status === "SENT" ? new Date() : undefined,
      },
    });
  }

  async deleteScheduledEmail(id: string): Promise<boolean> {
    const result = await this.prisma.scheduledEmailNotification.delete({
      where: { id },
    });
    return !!result.id;
  }
}
