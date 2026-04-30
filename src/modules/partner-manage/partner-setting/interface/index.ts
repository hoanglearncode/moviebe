import { PartnerSetting, PartnerSettingUpdate } from "@/modules/partner-manage/partner-setting/model/model";

export interface IPartnerSettingRepository {
  findByPartnerId(partnerId: string): Promise<PartnerSetting | null>;
  upsert(partnerId: string, data: Partial<Omit<PartnerSetting, "id" | "partnerId" | "createdAt" | "updatedAt">>): Promise<PartnerSetting>;
}

export interface IPartnerSettingUseCase {
  get(partnerId: string): Promise<PartnerSetting>;
  update(partnerId: string, data: PartnerSettingUpdate): Promise<boolean>;
  reset(partnerId: string): Promise<boolean>;
}
