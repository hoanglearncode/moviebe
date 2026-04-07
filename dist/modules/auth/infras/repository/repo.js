"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthUserRepository = exports.PrismaAuthUserRepository = void 0;
const client_1 = require("@prisma/client");
const dto_1 = require("./dto");
class PrismaAuthUserRepository {
    constructor(prisma) {
        this.model = (0, dto_1.getUserModel)(prisma);
    }
    async get(id) {
        return this.model.findUnique({ where: { id } });
    }
    async findByCond(cond) {
        return this.model.findFirst({ where: cond });
    }
    async list(cond, paging) {
        const { page, limit } = paging;
        const where = cond;
        paging.total = await this.model.count({ where });
        return this.model.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
        });
    }
    async insert(data) {
        await this.model.create({ data });
        return true;
    }
    async update(id, data) {
        await this.model.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
        return true;
    }
    async delete(id, isHard = false) {
        if (isHard) {
            await this.model.delete({ where: { id } });
        }
        else {
            await this.model.update({
                where: { id },
                data: { status: client_1.UserStatus.INACTIVE, updatedAt: new Date() }
            });
        }
        return true;
    }
    async findByEmail(email) {
        return this.model.findUnique({ where: { email } });
    }
    async findByUsername(username) {
        return this.model.findFirst({ where: { username } });
    }
    async findByEmailOrUsername(identifier) {
        return this.model.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });
    }
    async markVerified(userId) {
        await this.model.update({
            where: { id: userId },
            data: { emailVerified: true, updatedAt: new Date() }
        });
        return true;
    }
    async updatePassword(userId, passwordHash) {
        await this.model.update({
            where: { id: userId },
            data: { password: passwordHash, updatedAt: new Date() }
        });
        return true;
    }
}
exports.PrismaAuthUserRepository = PrismaAuthUserRepository;
const createAuthUserRepository = (prisma) => new PrismaAuthUserRepository(prisma);
exports.createAuthUserRepository = createAuthUserRepository;
