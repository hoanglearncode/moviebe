"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionRepository = exports.PrismaSessionRepository = void 0;
const dto_1 = require("./dto");
function toUserSession(raw) {
    return {
        id: raw.id,
        userId: raw.userId,
        refreshToken: raw.refreshToken,
        deviceId: raw.deviceId ?? null,
        deviceName: raw.deviceName ?? null,
        deviceType: raw.deviceType ?? null,
        ipAddress: raw.ipAddress ?? null,
        userAgent: raw.userAgent ?? null,
        isActive: raw.isActive ?? true,
        expiresAt: raw.expiresAt,
        lastActivityAt: raw.lastActivityAt,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
    };
}
class PrismaSessionRepository {
    constructor(prisma) {
        this.model = (0, dto_1.getSessionModel)(prisma);
    }
    // ── IQueryRepository ──
    async get(id) {
        return this.findById(id);
    }
    async findByCond(cond) {
        const raw = await this.model.findFirst({ where: cond });
        return raw ? toUserSession(raw) : null;
    }
    async list(cond, paging) {
        const skip = ((paging.page ?? 1) - 1) * (paging.limit ?? 20);
        const rows = await this.model.findMany({
            where: cond,
            skip,
            take: paging.limit ?? 20,
            orderBy: { createdAt: "desc" },
        });
        return rows.map(toUserSession);
    }
    // ── ICommandRepository ──
    async insert(data) {
        await this.model.create({ data: data });
        return true;
    }
    async update(id, data) {
        await this.model.update({ where: { id }, data: data });
        return true;
    }
    /**
     * delete — isHard=true xoá hẳn, isHard=false deactivate
     */
    async delete(id, isHard) {
        if (isHard) {
            await this.model.delete({ where: { id } });
        }
        else {
            await this.model.update({ where: { id }, data: { isActive: false } });
        }
        return true;
    }
    // ── Domain-specific ──
    async findById(sessionId) {
        const raw = await this.model.findUnique({ where: { id: sessionId } });
        return raw ? toUserSession(raw) : null;
    }
    async findByUserId(userId) {
        const rows = await this.model.findMany({
            where: { userId, isActive: true },
            orderBy: { lastActivityAt: "desc" },
        });
        return rows.map(toUserSession);
    }
    async findActiveSession(sessionId) {
        const raw = await this.model.findFirst({
            where: { id: sessionId, isActive: true, expiresAt: { gt: new Date() } },
        });
        return raw ? toUserSession(raw) : null;
    }
    async revokeSession(sessionId) {
        await this.model.update({ where: { id: sessionId }, data: { isActive: false } });
        return true;
    }
    async revokeAllSessionsByUserId(userId) {
        const result = await this.model.updateMany({
            where: { userId, isActive: true },
            data: { isActive: false },
        });
        return result.count;
    }
    async deleteExpiredSessions() {
        const result = await this.model.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
        return result.count;
    }
}
exports.PrismaSessionRepository = PrismaSessionRepository;
const createSessionRepository = (prisma) => new PrismaSessionRepository(prisma);
exports.createSessionRepository = createSessionRepository;
