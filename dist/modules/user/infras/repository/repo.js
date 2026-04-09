"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSettingsRepository = exports.SessionRepository = exports.UserRepository = void 0;
exports.createUserRepository = createUserRepository;
exports.createSessionRepository = createSessionRepository;
exports.createUserSettingsRepository = createUserSettingsRepository;
const generic_prisma_repo_1 = require("../../../../share/repository/generic-prisma-repo");
/**
 * ==========================================
 * USER REPOSITORY
 * ==========================================
 */
class UserRepository extends generic_prisma_repo_1.BaseRepositoryPrisma {
    constructor(prismaClient) {
        const queryRepo = new generic_prisma_repo_1.BaseQueryRepositoryPrisma(prismaClient.user);
        const commandRepo = new generic_prisma_repo_1.BaseCommandRepositoryPrisma(prismaClient.user);
        super(queryRepo, commandRepo);
        this.prismaClient = prismaClient;
    }
    async get(id) {
        return null;
    }
    async findByCond(cond) {
        return null;
    }
    async list(cond, paging) {
        return [];
    }
    async insert(data) {
        return true;
    }
    async delete(id, isHard) {
        return true;
    }
    async update(id, data) {
        return true;
    }
    async findById(userId) {
        return this.prismaClient.user.findUnique({
            where: { id: userId },
        });
    }
    async findByEmail(email) {
        return this.prismaClient.user.findUnique({
            where: { email },
        });
    }
    async findByUsername(username) {
        return this.prismaClient.user.findUnique({
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
    async deleteUser(userId) {
        // Soft delete by changing status
        const result = await this.prismaClient.user.update({
            where: { id: userId },
            data: {
                status: "INACTIVE",
                updatedAt: new Date(),
            },
        });
        return !!result;
    }
    async updatePassword(userId, passwordHash) {
        const result = await this.prismaClient.user.update({
            where: { id: userId },
            data: {
                password: passwordHash,
                updatedAt: new Date(),
            },
        });
        return !!result;
    }
    async listUsers(query) {
        const { page, limit, keyword, email, username, role, status, sortBy, sortOrder } = query;
        const offset = (page - 1) * limit;
        // Build where clause
        const where = {};
        if (keyword) {
            where.OR = [
                { email: { contains: keyword, mode: "insensitive" } },
                { username: { contains: keyword, mode: "insensitive" } },
                { name: { contains: keyword, mode: "insensitive" } },
            ];
        }
        if (email)
            where.email = email;
        if (username)
            where.username = username;
        if (role)
            where.role = role;
        if (status)
            where.status = status;
        // Fetch total count
        const total = await this.prismaClient.user.count({ where });
        // Fetch paginated results
        const items = await this.prismaClient.user.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
        });
        return {
            items,
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
exports.UserRepository = UserRepository;
/**
 * ==========================================
 * SESSION REPOSITORY
 * ==========================================
 */
class SessionRepository extends generic_prisma_repo_1.BaseRepositoryPrisma {
    constructor(prismaClient) {
        const queryRepo = new generic_prisma_repo_1.BaseQueryRepositoryPrisma(prismaClient.session);
        const commandRepo = new generic_prisma_repo_1.BaseCommandRepositoryPrisma(prismaClient.session);
        super(queryRepo, commandRepo);
        this.prismaClient = prismaClient;
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
        const result = await this.prismaClient.session.update({
            where: { id: sessionId },
            data: { isActive: false, updatedAt: new Date() },
        });
        return !!result;
    }
    async revokeAllSessionsByUserId(userId) {
        const result = await this.prismaClient.session.updateMany({
            where: { userId },
            data: { isActive: false, updatedAt: new Date() },
        });
        return result.count;
    }
    async findActiveSession(sessionId) {
        return this.prismaClient.session.findUnique({
            where: { id: sessionId },
        }).then((session) => {
            if (!session || !session.isActive)
                return null;
            return session;
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
exports.SessionRepository = SessionRepository;
/**
 * ==========================================
 * USER SETTINGS REPOSITORY
 * ==========================================
 */
class UserSettingsRepository extends generic_prisma_repo_1.BaseRepositoryPrisma {
    constructor(prismaClient) {
        const queryRepo = new generic_prisma_repo_1.BaseQueryRepositoryPrisma(prismaClient.userSetting);
        const commandRepo = new generic_prisma_repo_1.BaseCommandRepositoryPrisma(prismaClient.userSetting);
        super(queryRepo, commandRepo);
        this.prismaClient = prismaClient;
    }
    async findByUserId(userId) {
        return this.prismaClient.userSetting.findUnique({
            where: { userId },
        });
    }
    async updateByUserId(userId, data) {
        return this.prismaClient.userSetting.update({
            where: { userId },
            data,
        });
    }
}
exports.UserSettingsRepository = UserSettingsRepository;
/**
 * Factory functions
 */
function createUserRepository(prismaClient) {
    return new UserRepository(prismaClient);
}
function createSessionRepository(prismaClient) {
    return new SessionRepository(prismaClient);
}
function createUserSettingsRepository(prismaClient) {
    return new UserSettingsRepository(prismaClient);
}
