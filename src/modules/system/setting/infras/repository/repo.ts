import { PrismaClient } from "@prisma/client";
import { getUserSettingModel } from "@/modules/system/setting/infras/repository/dto";

export class PrismaUserSettingsRepository {
  private readonly model: ReturnType<typeof getUserSettingModel>;

  constructor(prisma: PrismaClient) {
    this.model = getUserSettingModel(prisma);
  }
}
