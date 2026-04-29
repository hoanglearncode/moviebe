import { PrismaClient } from "@prisma/client";
import { getUserSettingModel } from "./dto";

export class PrismaUserSettingsRepository {
  private readonly model: ReturnType<typeof getUserSettingModel>;

  constructor(prisma: PrismaClient) {
    this.model = getUserSettingModel(prisma);
  }
}
