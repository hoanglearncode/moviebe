import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { protect, requireRole } from "../../share/middleware/auth";
import { SystemSettingsRepository } from "./infras/repository/repo";
import { SystemSettingsUseCase } from "./usecase/system-settings.usecase";
import { SystemSettingsHttpService } from "./infras/transport/http-service";

export { SystemSettingsService, initSystemSettingsService, getSystemSettingsService } from "./shared/settings-service";

const adminGuard = [...protect(requireRole("ADMIN"))];

export function buildAdminSystemSettingsRouter(prisma: PrismaClient): Router {
  const repo = new SystemSettingsRepository(prisma);
  const useCase = new SystemSettingsUseCase(repo);
  const httpService = new SystemSettingsHttpService(useCase, prisma);

  const router = Router();

  router.get("/", ...adminGuard, (req, res) => httpService.getSettings(req, res));
  router.patch("/", ...adminGuard, (req, res) => httpService.updateSettings(req, res));
  router.get("/status", ...adminGuard, (req, res) => httpService.getSystemStatus(req, res));

  return router;
}
