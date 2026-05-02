import { PrismaClient } from "@prisma/client";
import { IUserSetting } from "@/modules/system/setting/interface";
import {
  UpdateUserSettingSchema,
  UserSetting,
  UserSettingUpdate,
} from "@/modules/system/setting/model/model";
import { defaultSettings } from "@/share/common/seed-setting";
import { getUserSettingModel } from "@/modules/system/setting/infras/repository/dto";
import { ValidationError } from "@/share/transport/http-server";

export class UserSettingUseCase implements IUserSetting {
  private readonly model: ReturnType<typeof getUserSettingModel>;

  constructor(prisma: PrismaClient) {
    this.model = getUserSettingModel(prisma);
  }

  /**
   * Convert array toggle → object update
   */
  private mapArrayToObject(data: any[]): UserSettingUpdate {
    const result: any = {};

    for (const item of data) {
      if (!item.id || typeof item.enabled !== "boolean") {
        throw new ValidationError("Invalid setting item", item);
      }
      result[item.id] = item.enabled;
    }

    return result;
  }

  /**
   * Get user settings
   * Auto create default nếu chưa có
   */
  async get(userId: string): Promise<UserSetting> {
    let raw = await this.model.findUnique({ where: { userId } });

    if (!raw) {
      raw = await this.model.create({
        data: {
          userId,
          ...defaultSettings,
        },
      });
    }

    return raw;
  }

  /**
   * Update settings (PATCH style)
   */
  async update(userId: string, data: any): Promise<boolean> {
    if (!data) {
      throw new ValidationError("Update data is required");
    }

    // nếu FE gửi array → convert
    const mapped = Array.isArray(data) ? this.mapArrayToObject(data) : data;

    const updates = UpdateUserSettingSchema.parse(mapped);

    await this.model.upsert({
      where: { userId },
      update: updates,
      create: {
        userId,
        ...defaultSettings,
        ...updates,
      },
    });

    return true;
  }

  /**
   * Reset về default
   */
  async reset(userId: string): Promise<boolean> {
    await this.model.upsert({
      where: { userId },
      update: {
        ...defaultSettings,
      },
      create: {
        userId,
        ...defaultSettings,
      },
    });

    return true;
  }

  /**
   * Tạo default (nếu chưa có)
   */
  async default(userId: string): Promise<boolean> {
    const existed = await this.model.findUnique({
      where: { userId },
    });

    if (existed) {
      return true;
    }

    await this.model.create({
      data: {
        userId,
        ...defaultSettings,
      },
    });

    return true;
  }
}
