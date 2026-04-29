import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { PartnerSettingRepository } from "./infras/repository/repo";
import { PartnerSettingUseCase } from "./usecase";
import { PartnerSettingHttpService } from "./infras/transport/http-service";

export const buildPartnerSettingRouter = (
  prisma: PrismaClient,
  guard: any[],
): Router => {
  const router = Router();

  const repo = new PartnerSettingRepository(prisma);
  const usecase = new PartnerSettingUseCase(repo);
  const svc = new PartnerSettingHttpService(usecase);

  router.get("/settings", ...guard, (req, res) => svc.get(req, res));
  router.patch("/settings", ...guard, (req, res) => svc.update(req, res));
  router.post("/settings/reset", ...guard, (req, res) => svc.reset(req, res));

  return router;
};

export { PartnerSettingUseCase, PartnerSettingRepository };
export type { IPartnerSettingRepository, IPartnerSettingUseCase } from "./interface";
