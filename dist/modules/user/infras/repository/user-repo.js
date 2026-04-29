"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserRepository = exports.PrismaUserRepository = void 0;
const dto_1 = require("./dto");
const authorization_usecase_1 = require("../../usecase/authorization.usecase");
const authorizationUseCase = new authorization_usecase_1.AuthorizationUseCase();
function toUserProfile(raw) {
    return {
        id: raw.id,
        email: raw.email,
        username: raw.username ?? null,
        name: raw.name ?? null,
        password: raw.password ?? null,
        provider: raw.provider ?? "local",
        avatar: raw.avatar ?? null,
        phone: raw.phone ?? null,
        bio: raw.bio ?? null,
        location: raw.location ?? null,
        avatarColor: raw.avatarColor ?? undefined,
        role: raw.role,
        permissionsOverride: authorizationUseCase.normalizePermissionsOverride(raw.permissionsOverride),
        status: raw.status,
        emailVerified: raw.emailVerified ?? false,
        mustChangePassword: raw.mustChangePassword ?? false,
        lastLoginAt: raw.lastLoginAt ?? null,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
    };
}
function toOwnUserProfile(user) {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        provider: user.provider,
        avatar: user.avatar,
        status: user.status,
        bio: user.bio,
        location: user.location,
        avatarColor: user.avatarColor,
        phone: user.phone,
        emailVerified: user.emailVerified,
        role: user.role,
        permissionsOverride: user.permissionsOverride,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
    };
}
class PrismaUserRepository {
    constructor(prisma) {
        this.model = (0, dto_1.getUserModel)(prisma);
    }
    async get(id) {
        return this.findById(id);
    }
    async findByCond(cond) {
        const raw = await this.model.findFirst({ where: cond });
        return raw ? toUserProfile(raw) : null;
    }
    async list(cond, paging) {
        const skip = ((paging.page ?? 1) - 1) * (paging.limit ?? 20);
        const rows = await this.model.findMany({
            where: cond,
            skip,
            take: paging.limit ?? 20,
            orderBy: { createdAt: "desc" },
        });
        return rows.map(toUserProfile);
    }
    async insert(data) {
        await this.model.create({
            data: {
                id: data.id,
                email: data.email,
                name: data.name,
                username: data.username,
                password: data.password,
                role: data.role,
                status: data.status,
                provider: data.provider,
                emailVerified: data.emailVerified,
                mustChangePassword: data.mustChangePassword,
                avatarColor: data.avatarColor,
                permissionsOverride: data.permissionsOverride,
                phone: data.phone,
                bio: data.bio,
                location: data.location,
                avatar: data.avatar,
            },
        });
        return true;
    }
    async update(id, data) {
        await this.model.update({
            where: { id },
            data: data,
        });
        return true;
    }
    async delete(id, isHard) {
        if (isHard) {
            await this.model.delete({ where: { id } });
        }
        else {
            const user = await this.model.findUnique({
                where: { id },
                select: { email: true, username: true },
            });
            if (!user)
                return false;
            const timestamp = Date.now();
            const newEmail = `${user.email.split("@")[0]}+inactive_${timestamp}@deleted.local`;
            await this.model.update({
                where: { id },
                data: {
                    status: "INACTIVE",
                    email: newEmail,
                    username: `${user.username}__inactive_${timestamp}`,
                },
            });
        }
        return true;
    }
    async findById(userId) {
        const raw = await this.model.findUnique({ where: { id: userId } });
        return raw ? toUserProfile(raw) : null;
    }
    async findByEmail(email) {
        const raw = await this.model.findUnique({ where: { email } });
        return raw ? toUserProfile(raw) : null;
    }
    async findByUsername(username) {
        const raw = await this.model.findUnique({ where: { username } });
        return raw ? toUserProfile(raw) : null;
    }
    async updateProfile(userId, data) {
        const raw = await this.model.update({
            where: { id: userId },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.phone !== undefined && { phone: data.phone }),
                ...(data.avatar !== undefined && { avatar: data.avatar }),
                ...(data.bio !== undefined && { bio: data.bio }),
                ...(data.location !== undefined && { location: data.location }),
                ...(data.username !== undefined && { username: data.username }),
                ...(data.role !== undefined && { role: data.role }),
                ...(data.permissionsOverride !== undefined && {
                    permissionsOverride: data.permissionsOverride,
                }),
                ...(data.status !== undefined && { status: data.status }),
                ...(data.emailVerified !== undefined && { emailVerified: data.emailVerified }),
            },
        });
        return toUserProfile(raw);
    }
    async updatePassword(userId, passwordHash) {
        await this.model.update({
            where: { id: userId },
            data: { password: passwordHash, mustChangePassword: false },
        });
        return true;
    }
    async deleteUser(userId) {
        await this.model.delete({ where: { id: userId } });
        return true;
    }
    async countUsers() {
        return this.model.count();
    }
    async listUsers(cond) {
        const where = this.buildAdminWhere(cond);
        const orderBy = { [cond.sortBy]: cond.sortOrder };
        const skip = (cond.page - 1) * cond.limit;
        const [rows, total] = await Promise.all([
            this.model.findMany({ where, orderBy, skip, take: cond.limit }),
            this.model.count({ where }),
        ]);
        return {
            items: rows.map(toUserProfile).map(toOwnUserProfile),
            total,
        };
    }
    buildAdminWhere(cond) {
        const { keyword, email, username, role, status } = cond;
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
        if (status) {
            where.status = status;
        }
        else {
            where.status = { not: "INACTIVE" };
        }
        return where;
    }
}
exports.PrismaUserRepository = PrismaUserRepository;
const createUserRepository = (prisma) => new PrismaUserRepository(prisma);
exports.createUserRepository = createUserRepository;
