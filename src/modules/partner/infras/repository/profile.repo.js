"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPartnerRepository = exports.PartnerRepository = void 0;
class PartnerRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async get(id) {
        return this.findById(id);
    }
    async list(_cond, _paging) {
        const rows = await this.prisma.partner.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        return rows.map((r) => this.map(r));
    }
    async findByCond(cond) {
        if (cond.userId)
            return this.findByUserId(cond.userId);
        if (cond.taxCode)
            return this.findByTaxCode(cond.taxCode);
        if (cond.id)
            return this.findById(cond.id);
        return null;
    }
    async findById(partnerId) {
        const row = await this.prisma.partner.findUnique({ where: { id: partnerId } });
        return row ? this.map(row) : null;
    }
    async findByUserId(userId) {
        const row = await this.prisma.partner.findUnique({ where: { userId } });
        return row ? this.map(row) : null;
    }
    async findByTaxCode(taxCode) {
        const row = await this.prisma.partner.findUnique({ where: { taxCode } });
        return row ? this.map(row) : null;
    }
    async insert(data) {
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
                status: data.status,
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
    async update(id, data) {
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
    async delete(id, _isHard = false) {
        await this.prisma.partner.delete({ where: { id } });
        return true;
    }
    map(row) {
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
exports.PartnerRepository = PartnerRepository;
const createPartnerRepository = (prisma) => new PartnerRepository(prisma);
exports.createPartnerRepository = createPartnerRepository;
