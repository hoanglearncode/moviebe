"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthUserRepository = exports.PrismaAuthUserRepository = void 0;
const client_1 = require("@prisma/client");
const dto_1 = require("./dto");
const toAuthUser = (raw) => ({
    id: raw.id,
    email: raw.email,
    username: raw.username ?? null,
    name: raw.name ?? null,
    password: raw.password ?? null,
    provider: raw.provider,
    avatar: raw.avatar ?? null,
    phone: raw.phone ?? null,
    bio: raw.bio ?? null,
    location: raw.location ?? null,
    avatarColor: raw.avatarColor ?? undefined,
    role: raw.role,
    lastLoginAt: raw.lastLoginAt ?? null,
    emailVerified: raw.emailVerified,
    mustChangePassword: raw.mustChangePassword,
    status: raw.status,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
});
const toCreateInput = (data) => ({
    id: data.id,
    email: data.email,
    username: data.username,
    name: data.name,
    password: data.password,
    provider: data.provider,
    avatar: data.avatar,
    phone: data.phone,
    bio: data.bio,
    location: data.location,
    avatarColor: data.avatarColor,
    role: data.role,
    lastLoginAt: data.lastLoginAt,
    emailVerified: data.emailVerified,
    mustChangePassword: data.mustChangePassword,
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
});
const toUpdateInput = (data) => {
    const updateData = {};
    if (data.email !== undefined)
        updateData.email = data.email;
    if (data.username !== undefined)
        updateData.username = data.username;
    if (data.name !== undefined)
        updateData.name = data.name;
    if (data.password !== undefined)
        updateData.password = data.password;
    if (data.provider !== undefined)
        updateData.provider = data.provider;
    if (data.avatar !== undefined)
        updateData.avatar = data.avatar;
    if (data.phone !== undefined)
        updateData.phone = data.phone;
    if (data.bio !== undefined)
        updateData.bio = data.bio;
    if (data.location !== undefined)
        updateData.location = data.location;
    if (data.avatarColor !== undefined)
        updateData.avatarColor = data.avatarColor;
    if (data.role !== undefined)
        updateData.role = data.role;
    if (data.lastLoginAt !== undefined)
        updateData.lastLoginAt = data.lastLoginAt;
    if (data.emailVerified !== undefined)
        updateData.emailVerified = data.emailVerified;
    if (data.mustChangePassword !== undefined)
        updateData.mustChangePassword = data.mustChangePassword;
    if (data.status !== undefined)
        updateData.status = data.status;
    if (data.createdAt !== undefined)
        updateData.createdAt = data.createdAt;
    if (data.updatedAt !== undefined)
        updateData.updatedAt = data.updatedAt;
    return updateData;
};
class PrismaAuthUserRepository {
    constructor(prisma) {
        this.model = (0, dto_1.getUserModel)(prisma);
    }
    async get(id) {
        const raw = await this.model.findUnique({ where: { id } });
        return raw ? toAuthUser(raw) : null;
    }
    async findByCond(cond) {
        const raw = await this.model.findFirst({ where: cond });
        return raw ? toAuthUser(raw) : null;
    }
    async list(cond, paging) {
        const { page, limit } = paging;
        const where = cond;
        paging.total = await this.model.count({ where });
        const rows = await this.model.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
        });
        return rows.map(toAuthUser);
    }
    async insert(data) {
        await this.model.create({ data: toCreateInput(data) });
        return true;
    }
    async update(id, data) {
        await this.model.update({
            where: { id },
            data: toUpdateInput({ ...data, updatedAt: new Date() }),
        });
        return true;
    }
    async delete(id, isHard = false) {
        if (isHard) {
            await this.model.delete({ where: { id } });
        }
        else {
            await this.model.update({
                where: { id },
                data: { status: client_1.UserStatus.INACTIVE, updatedAt: new Date() },
            });
        }
        return true;
    }
    async findByEmail(email) {
        const raw = await this.model.findUnique({ where: { email } });
        return raw ? toAuthUser(raw) : null;
    }
    async findByUsername(username) {
        const raw = await this.model.findFirst({ where: { username } });
        return raw ? toAuthUser(raw) : null;
    }
    async findByEmailOrUsername(identifier) {
        const raw = await this.model.findFirst({
            where: {
                OR: [{ email: identifier }, { username: identifier }],
            },
        });
        return raw ? toAuthUser(raw) : null;
    }
    async markVerified(userId) {
        await this.model.update({
            where: { id: userId },
            data: { emailVerified: true, updatedAt: new Date() },
        });
        return true;
    }
    async updatePassword(userId, passwordHash) {
        await this.model.update({
            where: { id: userId },
            data: { password: passwordHash, updatedAt: new Date() },
        });
        return true;
    }
}
exports.PrismaAuthUserRepository = PrismaAuthUserRepository;
const createAuthUserRepository = (prisma) => new PrismaAuthUserRepository(prisma);
exports.createAuthUserRepository = createAuthUserRepository;
