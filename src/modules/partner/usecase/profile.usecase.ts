import { IPartnerRepository, IPartnerProfileUseCase } from "../interface/profile.interface";
import { PartnerProfile } from "../model/model";
import { UpdatePartnerDTO } from "../model/dto";

export class PartnerProfileUseCase implements IPartnerProfileUseCase {
  constructor(private readonly partnerRepo: IPartnerRepository) {}

  async getProfile(partnerId: string): Promise<PartnerProfile> {
    const partner = await this.partnerRepo.findById(partnerId);
    if (!partner) throw new Error("Partner not found");
    return partner;
  }

  async updateProfile(partnerId: string, data: UpdatePartnerDTO): Promise<PartnerProfile> {
    const partner = await this.partnerRepo.findById(partnerId);
    if (!partner) throw new Error("Partner not found");

    await this.partnerRepo.update(partnerId, { ...data, updatedAt: new Date() });

    const updated = await this.partnerRepo.findById(partnerId);
    if (!updated) throw new Error("Partner not found after update");
    return updated;
  }

  async getStatus(partnerId: string): Promise<{ status: string; approvedAt?: Date }> {
    const partner = await this.partnerRepo.findById(partnerId);
    if (!partner) throw new Error("Partner not found");
    return { status: partner.status, approvedAt: partner.approvedAt ?? undefined };
  }
}
