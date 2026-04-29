import { IRepository } from "../../../share/interface";
import { PartnerStaff } from "../model/model";

export interface IStaffRepo extends IRepository<
  PartnerStaff,
  Partial<PartnerStaff>,
  Partial<PartnerStaff>
> {
  findById(id: string): Promise<PartnerStaff | null>;
  findByPartnerId(partnerId: string): Promise<PartnerStaff[]>;
  findByUserId(userId: string): Promise<PartnerStaff[]>;
}
