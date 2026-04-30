import { PrismaClient } from "@prisma/client";
import { IPartnerSettingRepository } from "@/modules/partner-manage/partner-setting/interface";
import { PartnerSetting } from "@/modules/partner-manage/partner-setting/model/model";

export class PartnerSettingRepository implements IPartnerSettingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByPartnerId(partnerId: string): Promise<PartnerSetting | null> {
    return this.prisma.partnerSetting.findUnique({ where: { partnerId } });
  }

  async upsert(
    partnerId: string,
    data: Partial<Omit<PartnerSetting, "id" | "partnerId" | "createdAt" | "updatedAt">>,
  ): Promise<PartnerSetting> {
    return this.prisma.partnerSetting.upsert({
      where: { partnerId },
      update: { ...data, updatedAt: new Date() },
      create: { partnerId, ...data },
    });
  }
}
