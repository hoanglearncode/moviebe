import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaBroadcastRepository } from "./infras/repository/repository";
import { BroadcastNotificationUseCase } from "./usecase";
import { BroadcastNotificationHttpService } from "./infras/transport/http-service";

export function buildAdminNotificationsRouter(prisma: PrismaClient): Router {
  const repo = new PrismaBroadcastRepository(prisma);
  const useCase = new BroadcastNotificationUseCase(repo, prisma);
  const httpService = new BroadcastNotificationHttpService(useCase, prisma);
  return httpService.buildRouter();
}
