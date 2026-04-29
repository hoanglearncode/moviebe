import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import {
  PrismaPushNotificationRepository,
  EmailTemplateRepository,
  ScheduledEmailRepository,
} from "./infras/repository/repository";
import { NotificationQueueAdapter } from "./infras/queue/notification-queue-adapter";
import {
  createPushNotificationService,
} from "./usecase/push-notification";
import { EmailNotificationService } from "./usecase/service";
import { buildNotificationRouter } from "./infras/transport/notification-endpoints";
import { buildAdminEmailRouter as buildAdminEmailTransportRouter } from "./infras/transport/admin-endpoints";

export type {
  IEmailTemplateRepository,
  IScheduledEmailRepository,
} from "./infras/repository/repository";
export { EmailTemplateRepository, ScheduledEmailRepository } from "./infras/repository/repository";
export type { EmailNotificationPayload } from "./model/types";
export { EmailNotificationEventType } from "./model/types";
export { EmailNotificationService } from "./usecase/service";
export { PushNotificationService, createPushNotificationService, NotificationFactory } from "./usecase/push-notification";
export { seedEmailTemplates } from "./shared/seed";

export function buildNotificationRouterFactory(prismaClient: PrismaClient): Router {
  const repository = new PrismaPushNotificationRepository(prismaClient);
  const queueAdapter = new NotificationQueueAdapter();
  const service = createPushNotificationService(repository, queueAdapter);
  return buildNotificationRouter(service);
}

export function buildAdminEmailRouter(prismaClient: PrismaClient): Router {
  const emailTemplateRepo = new EmailTemplateRepository(prismaClient);
  const scheduledEmailRepo = new ScheduledEmailRepository(prismaClient);
  const emailNotificationService = new EmailNotificationService(emailTemplateRepo, scheduledEmailRepo);

  return buildAdminEmailTransportRouter({
    emailNotificationService,
    findUserById: async (userId: string) =>
      prismaClient.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      }),
    findUsersByIds: async (userIds: string[]) =>
      prismaClient.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true },
      }),
  });
}
