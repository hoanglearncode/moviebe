import { Router } from "express";
import { PrismaClient } from "@prisma/client";

import { AdminUserHttpService } from "./infras/transport/http-service";
import { UserSettingUseCase } from "./usecase/user-setting.usecase";
import { IUserSetting } from "./interface";

import { protect } from "../../../share/middleware/auth";
import { prisma } from "../../../share/component/prisma";
import { UpdateUserSettingSchema } from "./model/model";

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
