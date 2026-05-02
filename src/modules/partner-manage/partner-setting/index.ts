import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { PartnerSettingRepository } from "@/modules/partner-manage/partner-setting/infras/repository/repo";
import { PartnerSettingUseCase } from "@/modules/partner-manage/partner-setting/usecase";
import { PartnerSettingHttpService } from "@/modules/partner-manage/partner-setting/infras/transport/http-service";

export const buildPartnerSettingRouter = (prisma: PrismaClient, guard: any[]): Router => {
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
export type {
  IPartnerSettingRepository,
  IPartnerSettingUseCase,
} from "@/modules/partner-manage/partner-setting/interface";
