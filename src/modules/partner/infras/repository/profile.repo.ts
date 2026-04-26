import { PrismaClient } from "@prisma/client";
import { IPartnerRepository } from "../../interface/profile.interface";
import { PartnerProfile } from "../../model/model";
import { UpdatePartnerDTO } from "../../model/dto";
import { PagingDTO } from "../../../../share";

export class PartnerRepository implements IPartnerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(id: string): Promise<PartnerProfile | null> {
    return this.findById(id);
  }

  async list(_cond: Partial<PartnerProfile>, _paging: PagingDTO): Promise<PartnerProfile[]> {
    const rows = await this.prisma.partner.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return rows.map((r: any) => this.map(r));
  }

  async findByCond(cond: Partial<PartnerProfile>): Promise<PartnerProfile | null> {
    if (cond.userId) return this.findByUserId(cond.userId);
    if (cond.taxCode) return this.findByTaxCode(cond.taxCode);
    if (cond.id) return this.findById(cond.id);
    return null;
  }

  async findById(partnerId: string): Promise<PartnerProfile | null> {
    const row = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    return row ? this.map(row) : null;
  }

  async findByUserId(userId: string): Promise<PartnerProfile | null> {
    const row = await this.prisma.partner.findUnique({ where: { userId } });
    return row ? this.map(row) : null;
  }

  async findByTaxCode(taxCode: string): Promise<PartnerProfile | null> {
    const row = await this.prisma.partner.findUnique({ where: { taxCode } });
    return row ? this.map(row) : null;
  }

  async insert(data: PartnerProfile): Promise<boolean> {
    await this.prisma.partner.create({
      data: {
        id: data.id,
        userId: data.userId,
        cinemaName: data.cinemaName,
        address: data.address,
        city: data.city,
        country: data.country,
        postalCode: data.postalCode ?? null,
        phone: data.phone,
        email: data.email,
        website: data.website ?? null,
        logo: data.logo ?? null,
        taxCode: data.taxCode,
        businessLicense: data.businessLicense ?? null,
        businessLicenseFile: data.businessLicenseFile ?? null,
        representativeName: data.representativeName ?? null,
        representativeIdNumber: data.representativeIdNumber ?? null,
        representativeIdFile: data.representativeIdFile ?? null,
        taxCertificateFile: data.taxCertificateFile ?? null,
        bankAccountName: data.bankAccountName,
        bankAccountNumber: data.bankAccountNumber,
        bankName: data.bankName,
        bankCode: data.bankCode,
        status: data.status as any,
        approvedAt: data.approvedAt ?? null,
        rejectionReason: data.rejectionReason ?? null,
        approvedBy: data.approvedBy ?? null,
        commissionRate: data.commissionRate,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
    return true;
  }

  async update(id: string, data: UpdatePartnerDTO & { updatedAt?: Date; commissionRate?: number }): Promise<boolean> {
    await this.prisma.partner.update({
      where: { id },
      data: {
        ...(data.cinemaName && { cinemaName: data.cinemaName }),
        ...(data.address && { address: data.address }),
        ...(data.city && { city: data.city }),
        ...(data.country && { country: data.country }),
        ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email && { email: data.email }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.logo !== undefined && { logo: data.logo }),
        ...(data.bankAccountName && { bankAccountName: data.bankAccountName }),
        ...(data.bankAccountNumber && { bankAccountNumber: data.bankAccountNumber }),
        ...(data.bankName && { bankName: data.bankName }),
        ...(data.bankCode && { bankCode: data.bankCode }),
        ...(data.commissionRate !== undefined && { commissionRate: data.commissionRate }),
        updatedAt: data.updatedAt ?? new Date(),
      },
    });
    return true;
  }

  async delete(id: string, _isHard = false): Promise<boolean> {
    await this.prisma.partner.delete({ where: { id } });
    return true;
  }

  private map(row: any): PartnerProfile {
    return {
      id: row.id,
      userId: row.userId,
      cinemaName: row.cinemaName,
      address: row.address,
      city: row.city,
      country: row.country,
      postalCode: row.postalCode,
      phone: row.phone,
      email: row.email,
      website: row.website,
      logo: row.logo,
      taxCode: row.taxCode,
      businessLicense: row.businessLicense,
      businessLicenseFile: row.businessLicenseFile,
      representativeName: row.representativeName,
      representativeIdNumber: row.representativeIdNumber,
      representativeIdFile: row.representativeIdFile,
      taxCertificateFile: row.taxCertificateFile,
      bankAccountName: row.bankAccountName,
      bankAccountNumber: row.bankAccountNumber,
      bankName: row.bankName,
      bankCode: row.bankCode,
      status: row.status,
      approvedAt: row.approvedAt,
      rejectionReason: row.rejectionReason,
      approvedBy: row.approvedBy,
      commissionRate: row.commissionRate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export const createPartnerRepository = (prisma: PrismaClient): IPartnerRepository =>
  new PartnerRepository(prisma);
