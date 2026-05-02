import {
  IPartnerSettingRepository,
  IPartnerSettingUseCase,
} from "@/modules/partner-manage/partner-setting/interface";
import {
  PartnerSetting,
  PartnerSettingUpdate,
  UpdatePartnerSettingSchema,
  defaultPartnerSettings,
} from "@/modules/partner-manage/partner-setting/model/model";
import { ValidationError } from "@/share/transport/http-server";

export class PartnerSettingUseCase implements IPartnerSettingUseCase {
  constructor(private readonly repo: IPartnerSettingRepository) {}

  async get(partnerId: string): Promise<PartnerSetting> {
    let setting = await this.repo.findByPartnerId(partnerId);
    if (!setting) {
      setting = await this.repo.upsert(partnerId, defaultPartnerSettings);
    }
    return setting;
  }

  async update(partnerId: string, data: PartnerSettingUpdate): Promise<boolean> {
    if (!data || Object.keys(data).length === 0) {
      throw new ValidationError("Update data is required");
    }
    const updates = UpdatePartnerSettingSchema.parse(data);
    await this.repo.upsert(partnerId, updates);
    return true;
  }

  async reset(partnerId: string): Promise<boolean> {
    await this.repo.upsert(partnerId, defaultPartnerSettings);
    return true;
  }
}
