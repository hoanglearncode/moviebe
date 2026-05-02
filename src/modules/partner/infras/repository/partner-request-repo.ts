import { PrismaClient, PartnerRequest } from "@prisma/client";
import { IPartnerRequestRepository } from "@/modules/partner/interface/partner-request.interface";
import { PartnerRequestRow, PartnerRequestUpdateInput } from "@/modules/partner/model/model";
import { SubmitPartnerRequestInput } from "@/modules/partner/model/dto";
import { PagingDTO } from "@/share";

export class PartnerRequestRepository implements IPartnerRequestRepository {
  constructor(private prismaClient: PrismaClient) {}
  private async attachUser(row: PartnerRequest): Promise<PartnerRequestRow> {
    const user = await this.prismaClient.user.findUnique({
      where: { id: row.userId },
      select: { id: true, name: true, email: true, avatar: true, phone: true },
    });

    return {
      ...row,
      bankCode: (row as any).bankCode ?? "",
      user: user ?? undefined,
    };
  }

  async create(data: SubmitPartnerRequestInput): Promise<PartnerRequestRow> {
    const row = await this.prismaClient.partnerRequest.create({
      data: {
        userId: data.userId,
        cinemaName: data.cinemaName,
        address: data.address,
        city: data.city,
        phone: data.phone,
        email: data.email,
        logo: data.logo ?? null,
        taxCode: data.taxCode,
        businessLicense: data.businessLicense,
        businessLicenseFile: data.businessLicenseFile,
        representativeName: data.representativeName,
        representativeIdNumber: data.representativeIdNumber,
        representativeIdFile: data.representativeIdFile,
        taxCertificateFile: data.taxCertificateFile,
        bankAccountName: data.bankAccountName,
        bankAccountNumber: data.bankAccountNumber,
        bankName: data.bankName,
      },
    });
    return this.attachUser(row);
  }

  async findByUserId(userId: string): Promise<PartnerRequestRow | null> {
    const row = await this.prismaClient.partnerRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (!row) return null;
    return this.attachUser(row);
  }

  async findById(id: string): Promise<PartnerRequestRow | null> {
    const row = await this.prismaClient.partnerRequest.findUnique({
      where: { id },
    });
    if (!row) return null;
    return this.attachUser(row);
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ items: PartnerRequestRow[]; paging: PagingDTO }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { status, search } = query;
    const skip = (page - 1) * limit;
    const where: any = {
      ...(status && status !== "all" && { status }),
      ...(search && {
        OR: [
          { cinemaName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { taxCode: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [rows, total] = await Promise.all([
      this.prismaClient.partnerRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prismaClient.partnerRequest.count({ where }),
    ]);

    const items = await Promise.all(rows.map((row) => this.attachUser(row)));
    const paging: PagingDTO = {
      page,
      limit,
      total,
    };
    return { items, paging };
  }

  async updateStatus(
    id: string,
    status: string,
    reviewedBy: string,
    rejectionReason?: string,
    approvedPartnerId?: string,
  ): Promise<boolean> {
    await this.prismaClient.partnerRequest.update({
      where: { id },
      data: {
        status: status as any,
        reviewedBy,
        reviewedAt: new Date(),
        ...(rejectionReason && { rejectionReason }),
        ...(approvedPartnerId && { approvedPartnerId }),
      },
    });

    return true;
  }

  async getStatsData(): Promise<any> {
    const [total, pending, reject, approve] = await Promise.all([
      this.prismaClient.partnerRequest.count(),
      this.prismaClient.partnerRequest.count({ where: { status: "PENDING" } }),
      this.prismaClient.partnerRequest.count({ where: { status: "REJECTED" } }),
      this.prismaClient.partnerRequest.count({ where: { status: "APPROVED" } }),
    ]);

    return { total, pending, reject, approve };
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prismaClient.partnerRequest.count({
      where: {
        userId,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });
    return count > 0;
  }

  async update(id: string, data: PartnerRequestUpdateInput): Promise<PartnerRequestRow> {
    const row = await this.prismaClient.partnerRequest.update({
      where: { id },
      data: {
        ...data,
      },
    });

    return this.attachUser(row);
  }
}

export function createPartnerRequestRepository(
  prismaClient: PrismaClient,
): IPartnerRequestRepository {
  return new PartnerRequestRepository(prismaClient);
}
