import { IRepository } from "../../../share/interface";
import { PartnerProfile } from "../model/model";
import { UpdatePartnerDTO } from "../model/dto";

// ─── Repository Port ──────────────────────────────────────────────────────────

export interface IPartnerRepository
  extends IRepository<PartnerProfile, Partial<PartnerProfile>, Partial<PartnerProfile>> {
  findById(partnerId: string): Promise<PartnerProfile | null>;
  findByUserId(userId: string): Promise<PartnerProfile | null>;
  findByTaxCode(taxCode: string): Promise<PartnerProfile | null>;
}

// ─── Use-Case Port ────────────────────────────────────────────────────────────

export interface IPartnerProfileUseCase {
  getProfile(partnerId: string): Promise<PartnerProfile>;
  updateProfile(partnerId: string, data: UpdatePartnerDTO): Promise<PartnerProfile>;
  getStatus(partnerId: string): Promise<{ status: string; approvedAt?: Date }>;
}