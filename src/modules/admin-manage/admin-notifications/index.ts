import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaBroadcastRepository } from "@/modules/admin-manage/admin-notifications/infras/repository/repository";
import { BroadcastNotificationUseCase } from "@/modules/admin-manage/admin-notifications/usecase";
import { BroadcastNotificationHttpService } from "@/modules/admin-manage/admin-notifications/infras/transport/http-service";

export function buildAdminNotificationsRouter(prisma: PrismaClient): Router {
  const repo = new PrismaBroadcastRepository(prisma);
  const useCase = new BroadcastNotificationUseCase(repo, prisma);
  const httpService = new BroadcastNotificationHttpService(useCase, prisma);
  return httpService.buildRouter();
}
