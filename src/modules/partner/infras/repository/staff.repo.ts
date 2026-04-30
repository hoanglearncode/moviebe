import { PrismaClient } from "@prisma/client";
import { PagingDTO } from "@/share";
import { IStaffRepo } from "@/modules/partner/interface/staff.interface";
import { PartnerStaff } from "@/modules/partner/model/model";

export class StaffRepository implements IStaffRepo {
  constructor(private readonly prisma: PrismaClient) {}

  async get(id: string): Promise<PartnerStaff | null> {
    return this.findById(id);
  }

  async list(cond: Partial<PartnerStaff>, paging: PagingDTO): Promise<PartnerStaff[]> {
    const page = paging.page ?? 1;
    const limit = paging.limit ?? 20;
    const skip = (page - 1) * limit;
    const rows = await this.prisma.partnerStaff.findMany({
      where: cond as any,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    return rows as PartnerStaff[];
  }

  async findByCond(cond: Partial<PartnerStaff>): Promise<PartnerStaff | null> {
    const row = await this.prisma.partnerStaff.findFirst({
      where: cond as any,
      orderBy: { createdAt: "desc" },
    });
    return row ? (row as PartnerStaff) : null;
  }

  async findById(id: string): Promise<PartnerStaff | null> {
    const row = await this.prisma.partnerStaff.findUnique({ where: { id } });
    return row ? (row as PartnerStaff) : null;
  }

  async findByPartnerId(partnerId: string): Promise<PartnerStaff[]> {
    const rows = await this.prisma.partnerStaff.findMany({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
    });
    return rows as PartnerStaff[];
  }

  async findByUserId(userId: string): Promise<PartnerStaff[]> {
    const rows = await this.prisma.partnerStaff.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows as PartnerStaff[];
  }

  async insert(data: PartnerStaff): Promise<boolean> {
    await this.prisma.partnerStaff.create({
      data: data as any,
    });
    return true;
  }

  async update(id: string, data: Partial<PartnerStaff>): Promise<boolean> {
    await this.prisma.partnerStaff.update({
      where: { id },
      data: data as any,
    });
    return true;
  }

  async delete(id: string, _isHard = false): Promise<boolean> {
    await this.prisma.partnerStaff.delete({ where: { id } });
    return true;
  }
}

export const createStaffRepository = (prisma: PrismaClient): IStaffRepo =>
  new StaffRepository(prisma);
