import { Router } from "express";
import { PrismaClient } from "@prisma/client";

import { AdminUserHttpService } from "@/modules/system/setting/infras/transport/http-service";
import { UserSettingUseCase } from "@/modules/system/setting/usecase/user-setting.usecase";
import { IUserSetting } from "@/modules/system/setting/interface";

import { protect } from "@/share/middleware/auth";
import { prisma } from "@/share/component/prisma";
import { UpdateUserSettingSchema } from "@/modules/system/setting/model/model";

export const createSettingUseCase = (prismaClient: PrismaClient = prisma): IUserSetting => {
  return new UserSettingUseCase(prismaClient);
};

export const setupSettingHexagon = (
  prismaClient: PrismaClient = prisma,
  settingUseCase?: IUserSetting,
) => {
  const useCase: IUserSetting = settingUseCase || createSettingUseCase(prismaClient);

  const httpService = new AdminUserHttpService(useCase, UpdateUserSettingSchema);

  const router = Router();

  router.get("/settings", ...protect(), httpService.list.bind(httpService));

  router.patch("/settings", ...protect(), httpService.update.bind(httpService));

  router.post("/settings/reset", ...protect(), httpService.reset.bind(httpService));

  return { router, useCase };
};
