"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStaffRepository = exports.StaffRepository = void 0;
class StaffRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async get(id) {
        return this.findById(id);
    }
    async list(cond, paging) {
        const page = paging.page ?? 1;
        const limit = paging.limit ?? 20;
        const skip = (page - 1) * limit;
        const rows = await this.prisma.partnerStaff.findMany({
            where: cond,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        });
        return rows;
    }
    async findByCond(cond) {
        const row = await this.prisma.partnerStaff.findFirst({
            where: cond,
            orderBy: { createdAt: "desc" },
        });
        return row ? row : null;
    }
    async findById(id) {
        const row = await this.prisma.partnerStaff.findUnique({ where: { id } });
        return row ? row : null;
    }
    async findByPartnerId(partnerId) {
        const rows = await this.prisma.partnerStaff.findMany({
            where: { partnerId },
            orderBy: { createdAt: "desc" },
        });
        return rows;
    }
    async findByUserId(userId) {
        const rows = await this.prisma.partnerStaff.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        return rows;
    }
    async insert(data) {
        await this.prisma.partnerStaff.create({
            data: data,
        });
        return true;
    }
    async update(id, data) {
        await this.prisma.partnerStaff.update({
            where: { id },
            data: data,
        });
        return true;
    }
    async delete(id, _isHard = false) {
        await this.prisma.partnerStaff.delete({ where: { id } });
        return true;
    }
}
exports.StaffRepository = StaffRepository;
const createStaffRepository = (prisma) => new StaffRepository(prisma);
exports.createStaffRepository = createStaffRepository;
