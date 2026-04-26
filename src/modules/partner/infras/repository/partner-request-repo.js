"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerRequestRepository = void 0;
exports.createPartnerRequestRepository = createPartnerRequestRepository;
class PartnerRequestRepository {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async attachUser(row) {
        const user = await this.prismaClient.user.findUnique({
            where: { id: row.userId },
            select: { id: true, name: true, email: true, avatar: true, phone: true },
        });
        return {
            ...row,
            bankCode: row.bankCode ?? "",
            user: user ?? undefined,
        };
    }
    async create(data) {
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
    async findByUserId(userId) {
        const row = await this.prismaClient.partnerRequest.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        if (!row)
            return null;
        return this.attachUser(row);
    }
    async findById(id) {
        const row = await this.prismaClient.partnerRequest.findUnique({
            where: { id },
        });
        if (!row)
            return null;
        return this.attachUser(row);
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const { status, search } = query;
        const skip = (page - 1) * limit;
        const where = {
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
        const paging = {
            page,
            limit,
            total,
        };
        return { items, paging };
    }
    async updateStatus(id, status, reviewedBy, rejectionReason, approvedPartnerId) {
        await this.prismaClient.partnerRequest.update({
            where: { id },
            data: {
                status: status,
                reviewedBy,
                reviewedAt: new Date(),
                ...(rejectionReason && { rejectionReason }),
                ...(approvedPartnerId && { approvedPartnerId }),
            },
        });
        return true;
    }
    async getStatsData() {
        const [total, pending, reject, approve] = await Promise.all([
            this.prismaClient.partnerRequest.count(),
            this.prismaClient.partnerRequest.count({ where: { status: "PENDING" } }),
            this.prismaClient.partnerRequest.count({ where: { status: "REJECTED" } }),
            this.prismaClient.partnerRequest.count({ where: { status: "APPROVED" } }),
        ]);
        return { total, pending, reject, approve };
    }
    async existsByUserId(userId) {
        const count = await this.prismaClient.partnerRequest.count({
            where: {
                userId,
                status: { in: ["PENDING", "APPROVED"] },
            },
        });
        return count > 0;
    }
    async update(id, data) {
        const row = await this.prismaClient.partnerRequest.update({
            where: { id },
            data: {
                ...data,
            },
        });
        return this.attachUser(row);
    }
}
exports.PartnerRequestRepository = PartnerRequestRepository;
function createPartnerRequestRepository(prismaClient) {
    return new PartnerRequestRepository(prismaClient);
}
