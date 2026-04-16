import { PrismaClient } from "@prisma/client";

export interface PartnerRequestRow {
  id: string;
  userId: string;
  cinemaName: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  logo: string | null;
  taxCode: string;
  businessLicense: string | null;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  status: string;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    phone: string | null;
  };
}

export type PartnerRequestCreateInput = Omit<
  PartnerRequestRow,
  "id" | "status" | "rejectionReason" | "reviewedBy" | "reviewedAt" | "createdAt" | "user"
>;

export type PartnerRequestUpdateInput = Partial<
  Pick<
    PartnerRequestRow,
    | "cinemaName"
    | "address"
    | "city"
    | "phone"
    | "email"
    | "logo"
    | "taxCode"
    | "businessLicense"
    | "bankAccountName"
    | "bankAccountNumber"
    | "bankName"
  >
>;

export interface IPartnerRequestRepository {
  create(data: PartnerRequestCreateInput): Promise<PartnerRequestRow>;
  findByUserId(userId: string): Promise<PartnerRequestRow | null>;
  findById(id: string): Promise<PartnerRequestRow | null>;
  findAll(query: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }): Promise<{ items: PartnerRequestRow[]; total: number }>;
  updateStatus(
    id: string,
    status: string,
    reviewedBy: string,
    rejectionReason?: string,
  ): Promise<boolean>;
  existsByUserId(userId: string): Promise<boolean>;
  update(id: string, data: PartnerRequestUpdateInput): Promise<PartnerRequestRow>;
}

export class PartnerRequestRepository implements IPartnerRequestRepository {
  constructor(private prismaClient: PrismaClient) {}

  private async attachUser(row: any): Promise<PartnerRequestRow> {
    const user = await this.prismaClient.user.findUnique({
      where: { id: row.userId },
      select: { id: true, name: true, email: true, avatar: true, phone: true },
    });
    return { ...row, user: user ?? undefined };
  }

  async create(data: PartnerRequestCreateInput): Promise<PartnerRequestRow> {
    const row = await (this.prismaClient.partnerRequest as any).create({
      data: {
        userId: data.userId,
        cinemaName: data.cinemaName,
        address: data.address,
        city: data.city,
        phone: data.phone,
        email: data.email,
        logo: data.logo ?? null,
        taxCode: data.taxCode,
        businessLicense: data.businessLicense ?? null,
        bankAccountName: data.bankAccountName,
        bankAccountNumber: data.bankAccountNumber,
        bankName: data.bankName,
      },
    });
    return this.attachUser(row);
  }

  async findByUserId(userId: string): Promise<PartnerRequestRow | null> {
    const row = await (this.prismaClient.partnerRequest as any).findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (!row) return null;
    return this.attachUser(row);
  }

  async findById(id: string): Promise<PartnerRequestRow | null> {
    const row = await (this.prismaClient.partnerRequest as any).findUnique({ where: { id } });
    if (!row) return null;
    return this.attachUser(row);
  }

  async findAll(query: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }): Promise<{ items: PartnerRequestRow[]; total: number }> {
    const { page = 1, limit = 20, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { cinemaName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { taxCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const [rows, total] = await Promise.all([
      (this.prismaClient.partnerRequest as any).findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      (this.prismaClient.partnerRequest as any).count({ where }),
    ]);

    const items = await Promise.all(rows.map((row: any) => this.attachUser(row)));
    return { items, total };
  }

  async updateStatus(
    id: string,
    status: string,
    reviewedBy: string,
    rejectionReason?: string,
  ): Promise<boolean> {
    await (this.prismaClient.partnerRequest as any).update({
      where: { id },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        ...(rejectionReason && { rejectionReason }),
      },
    });
    return true;
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await (this.prismaClient.partnerRequest as any).count({
      where: { userId, status: { in: ["PENDING", "APPROVED"] } },
    });
    return count > 0;
  }

  async update(id: string, data: PartnerRequestUpdateInput): Promise<PartnerRequestRow> {
    const row = await (this.prismaClient.partnerRequest as any).update({
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
