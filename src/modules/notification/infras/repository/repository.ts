import {
  PrismaClient,
  EmailTemplate,
  ScheduledEmailNotification,
  EmailNotificationEvent,
  Notification,
  NotificationType,
} from "@prisma/client";
import {
  CreateNotificationInput,
  IPushNotificationRepository,
  ListNotificationsQuery,
  NotificationListResult,
  NotificationListItem,
  NotificationPayload,
} from "../../interface";

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

export class PrismaPushNotificationRepository implements IPushNotificationRepository {
  constructor(private prisma: PrismaClient) {}

  private normalizeNotification(item: Notification): NotificationListItem {
    return {
      id: item.id,
      userId: item.userId,
      rawType: item.type,
      type: item.type,
      title: item.title,
      message: item.message,
      data: item.data as NotificationPayload | null,
      isRead: item.isRead,
      readAt: item.readAt,
      createdAt: item.createdAt,
    };
  }

  async createNotification(input: CreateNotificationInput): Promise<void> {
    await this.prisma.notification.create({
      data: {
        id: input.id,
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: (input.data ?? {}) as any,
        isRead: false,
      },
    });
  }

  async listNotifications(userId: string, query: ListNotificationsQuery): Promise<NotificationListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { userId };

    if (query.onlyUnread) {
      (where as any).isRead = false;
    }

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: items.map((item) => this.normalizeNotification(item)),
      total,
      page,
      limit,
      totalPages,
      unreadCount,
    };
  }

  async findNotificationWithData(
    notificationId: string,
    userId: string,
  ): Promise<{ isRead: boolean; data: NotificationPayload | null } | null> {
    const record = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
      select: { isRead: true, data: true },
    });

    if (!record) return null;
    return { isRead: record.isRead, data: record.data as NotificationPayload | null };
  }

  async findUnreadNotificationsWithData(userId: string): Promise<Array<{ data: NotificationPayload | null }>> {
    const records = await this.prisma.notification.findMany({
      where: { userId, isRead: false },
      select: { data: true },
    });

    return records.map((record) => ({
      data: record.data as NotificationPayload | null,
    }));
  }

  async markNotificationRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllNotificationsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return result.count;
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async incrementBroadcastReadCounts(broadcastCounts: Map<string, number>): Promise<void> {
    await Promise.all(
      Array.from(broadcastCounts.entries()).map(([broadcastId, count]) =>
        this.prisma.broadcastNotification
          .update({ where: { id: broadcastId }, data: { readCount: { increment: count } } })
          .catch(() => {}),
      ),
    );
  }
}
