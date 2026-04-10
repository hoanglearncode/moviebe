"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaUserSettingsRepository = exports.PrismaSessionRepository = exports.PrismaUserRepository = void 0;
exports.createUserRepository = createUserRepository;
exports.createSessionRepository = createSessionRepository;
exports.createUserSettingsRepository = createUserSettingsRepository;
const client_1 = require("@prisma/client");
class PrismaUserRepository {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async get(id) {
        return this.prismaClient.user.findUnique({
            where: { id },
        });
    }
    async findByCond(cond) {
        return this.prismaClient.user.findFirst({
            where: cond,
        });
    }
    async list(cond, paging) {
        const { page, limit } = paging;
        const where = cond;
        paging.total = await this.prismaClient.user.count({ where });
        return this.prismaClient.user.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
        });
    }
    async insert(data) {
        await this.prismaClient.user.create({
            data,
        });
        return true;
    }
    async update(id, data) {
        await this.prismaClient.user.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
        return true;
    }
    async delete(id, isHard = false) {
        if (isHard) {
            await this.prismaClient.user.delete({
                where: { id },
            });
            return true;
        }
        await this.prismaClient.user.update({
            where: { id },
            data: {
                status: client_1.UserStatus.INACTIVE,
                updatedAt: new Date(),
            },
        });
        return true;
    }
    async findById(userId) {
        return this.get(userId);
    }
    async findByEmail(email) {
        return this.prismaClient.user.findUnique({
            where: { email },
        });
    }
    async findByUsername(username) {
        return this.prismaClient.user.findFirst({
            where: { username },
        });
    }
    async updateProfile(userId, data) {
        return this.prismaClient.user.update({
            where: { id: userId },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
    }
    async updatePassword(userId, passwordHash) {
        await this.prismaClient.user.update({
            where: { id: userId },
            data: {
                password: passwordHash,
                updatedAt: new Date(),
            },
        });
        return true;
    }
    async deleteUser(userId) {
        return this.delete(userId, false);
    }
    async listUsers(query) {
        const { page, limit, keyword, email, username, role, status, sortBy, sortOrder, } = query;
        const where = {};
        if (keyword) {
            where.OR = [
                { email: { contains: keyword, mode: "insensitive" } },
                { username: { contains: keyword, mode: "insensitive" } },
                { name: { contains: keyword, mode: "insensitive" } },
            ];
        }
        if (email) {
            where.email = email;
        }
        if (username) {
            where.username = username;
        }
        if (role) {
            where.role = role;
        }
        if (status) {
            where.status = status;
        }
        const total = await this.prismaClient.user.count({ where });
        const items = await this.prismaClient.user.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
        });
        return {
            items: items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async countUsers() {
        return this.prismaClient.user.count();
    }
}
exports.PrismaUserRepository = PrismaUserRepository;
class PrismaSessionRepository {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async get(id) {
        return this.findById(id);
    }
    async findByCond(cond) {
        return this.prismaClient.session.findFirst({
            where: cond,
        });
    }
    async list(cond, paging) {
        const { page, limit } = paging;
        const where = cond;
        paging.total = await this.prismaClient.session.count({ where });
        return this.prismaClient.session.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
        });
    }
    async insert(data) {
        await this.prismaClient.session.create({
            data,
        });
        return true;
    }
    async update(id, data) {
        await this.prismaClient.session.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
        return true;
    }
    async delete(id, isHard = false) {
        if (isHard) {
            await this.prismaClient.session.delete({
                where: { id },
            });
            return true;
        }
        return this.revokeSession(id);
    }
    async findById(sessionId) {
        return this.prismaClient.session.findUnique({
            where: { id: sessionId },
        });
    }
    async findByUserId(userId) {
        return this.prismaClient.session.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    }
    async revokeSession(sessionId) {
        await this.prismaClient.session.update({
            where: { id: sessionId },
            data: {
                isActive: false,
                updatedAt: new Date(),
            },
        });
        return true;
    }
    async revokeAllSessionsByUserId(userId) {
        const result = await this.prismaClient.session.updateMany({
            where: { userId, isActive: true },
            data: {
                isActive: false,
                updatedAt: new Date(),
            },
        });
        return result.count;
    }
    async findActiveSession(sessionId) {
        return this.prismaClient.session.findFirst({
            where: {
                id: sessionId,
                isActive: true,
            },
        });
    }
    async deleteExpiredSessions() {
        const result = await this.prismaClient.session.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });
        return result.count;
    }
}
exports.PrismaSessionRepository = PrismaSessionRepository;
class PrismaUserSettingsRepository {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async get(id) {
        return this.prismaClient.userSetting.findUnique({
            where: { id },
        });
    }
    async findByCond(cond) {
        return this.prismaClient.userSetting.findFirst({
            where: cond,
        });
    }
    async list(cond, paging) {
        const { page, limit } = paging;
        const where = cond;
        paging.total = await this.prismaClient.userSetting.count({ where });
        return this.prismaClient.userSetting.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
        });
    }
    async insert(data) {
        await this.prismaClient.userSetting.create({
            data,
        });
        return true;
    }
    async update(id, data) {
        await this.prismaClient.userSetting.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
        return true;
    }
    async delete(id, isHard = false) {
        if (!isHard) {
            await this.prismaClient.userSetting.delete({
                where: { id },
            });
            return true;
        }
        await this.prismaClient.userSetting.delete({
            where: { id },
        });
        return true;
    }
    async findByUserId(userId) {
        return this.prismaClient.userSetting.findUnique({
            where: { userId },
        });
    }
    async upsertByUserId(userId, data) {
        return this.prismaClient.userSetting.upsert({
            where: { userId },
            update: {
                ...data,
                updatedAt: new Date(),
            },
            create: {
                userId,
                ...data,
            },
        });
    }
}
exports.PrismaUserSettingsRepository = PrismaUserSettingsRepository;
function createUserRepository(prismaClient) {
    return new PrismaUserRepository(prismaClient);
}
function createSessionRepository(prismaClient) {
    return new PrismaSessionRepository(prismaClient);
}
function createUserSettingsRepository(prismaClient) {
    return new PrismaUserSettingsRepository(prismaClient);
}
