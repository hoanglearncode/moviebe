import { PrismaClient } from "@prisma/client";

export const getUserSettingModel = (prisma: PrismaClient) => prisma.userSetting;
