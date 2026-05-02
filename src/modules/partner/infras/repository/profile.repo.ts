import { PrismaClient } from "@prisma/client";
import { IPartnerRepository } from "@/modules/partner/interface/profile.interface";
import { PartnerProfile } from "@/modules/partner/model/model";
import { UpdatePartnerDTO } from "@/modules/partner/model/dto";
import { PagingDTO } from "@/share";

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
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        // Thông tin tài khoản chủ sở hữu
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            avatar: true,
            avatarColor: true,
            phone: true,
            bio: true,
            location: true,
            role: true,
            status: true,
            emailVerified: true,
            lastLoginAt: true,
            createdAt: true,
            settings: {
              select: {
                notifications: true,
                marketingEmails: true,
                pushNotifications: true,
                smsNotifications: true,
                shareHistory: true,
                personalizedRecs: true,
              },
            },
          },
        },

        // Cài đặt vận hành của partner
        setting: true,

        // Ví tiền
        wallet: {
          select: {
            balance: true,
            totalEarned: true,
            totalWithdrawn: true,
            totalRefunded: true,
          },
        },

        // Danh sách nhân viên (bao gồm chủ rạp có thể là nhiều người)
        staffs: {
          select: {
            id: true,
            role: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                avatarColor: true,
                phone: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },

        // Thống kê phòng chiếu
        _count: {
          select: {
            rooms: true,
            movies: true,
          },
        },
      },
    });

    return partner ? this.map(partner) : null;
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

  async update(
    id: string,
    data: UpdatePartnerDTO & { updatedAt?: Date; commissionRate?: number },
  ): Promise<boolean> {
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
      // ── Partner core ──────────────────────────────
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
      description: row.description,
      facilities: row.facilities ?? [],
      lat: row.lat,
      lng: row.lng,

      // ── Legal documents ───────────────────────────
      taxCode: row.taxCode,
      businessLicense: row.businessLicense,
      businessLicenseFile: row.businessLicenseFile,
      representativeName: row.representativeName,
      representativeIdNumber: row.representativeIdNumber,
      representativeIdFile: row.representativeIdFile,
      taxCertificateFile: row.taxCertificateFile,

      // ── Bank ──────────────────────────────────────
      bankAccountName: row.bankAccountName,
      bankAccountNumber: row.bankAccountNumber,
      bankName: row.bankName,
      bankCode: row.bankCode,

      // ── Status ────────────────────────────────────
      status: row.status,
      commissionRate: row.commissionRate,
      approvedAt: row.approvedAt,
      rejectionReason: row.rejectionReason,
      approvedBy: row.approvedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,

      ...(row.user && { account: row.user }),
      ...(row.setting && { setting: row.setting }),
      ...(row.wallet && { wallet: row.wallet }),

      ...(row.staffs && {
        staffs: row.staffs.map((s: any) => ({
          id: s.id,
          role: s.role,
          createdAt: s.createdAt,
          user: s.user,
        })),
      }),

      // Stats aggregate
      ...(row._count && {
        stats: {
          totalRooms: row._count.rooms,
          totalMovies: row._count.movies,
        },
      }),
    };
  }
}

export const createPartnerRepository = (prisma: PrismaClient): IPartnerRepository =>
  new PartnerRepository(prisma);
