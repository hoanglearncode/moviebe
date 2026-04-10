"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUserUseCase = exports.UserUseCase = void 0;
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const http_server_1 = require("../../../share/transport/http-server");
const error_code_1 = require("../../../share/model/error-code");
const dto_1 = require("../model/dto");
class UserUseCase {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    async getProfile(userId) {
        const user = await this.getActiveUserOrThrow(userId);
        return this.mapToOwnProfile(user);
    }
    async updateProfile(userId, data) {
        this.ensureUserId(userId);
        const parsed = dto_1.UpdateProfilePayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid profile data", parsed.error.issues);
        }
        await this.ensureUserExists(userId);
        const updated = await this.dependencies.userRepository.updateProfile(userId, parsed.data);
        return this.mapToOwnProfile(updated);
    }
    async deleteAccount(userId) {
        const user = await this.ensureUserExists(userId);
        await this.dependencies.sessionRepository.revokeAllSessionsByUserId(userId);
        const deleted = await this.dependencies.userRepository.deleteUser(userId);
        if (!deleted) {
            throw new Error("Failed to delete user account");
        }
        await this.dependencies.notificationService.sendAccountDeletedNotification({
            email: user.email,
            name: user.name || user.username || "User",
        });
        return { message: "User account deleted successfully" };
    }
    async changePassword(userId, data) {
        this.ensureUserId(userId);
        const parsed = dto_1.ChangePasswordPayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid password data", parsed.error.issues);
        }
        const user = await this.ensureUserExists(userId);
        if (!user.password) {
            throw new http_server_1.UnauthorizedError("Password login is not available for this account");
        }
        const isValid = await this.dependencies.passwordHasher.compare(parsed.data.currentPassword, user.password);
        if (!isValid) {
            throw new http_server_1.UnauthorizedError("Current password is incorrect");
        }
        const newPasswordHash = await this.dependencies.passwordHasher.hash(parsed.data.newPassword);
        const updated = await this.dependencies.userRepository.updatePassword(userId, newPasswordHash);
        if (!updated) {
            throw new Error("Failed to update password");
        }
        await this.dependencies.sessionRepository.revokeAllSessionsByUserId(userId);
        await this.dependencies.notificationService.sendPasswordChangeConfirmation({
            email: user.email,
            name: user.name || user.username || "User",
        });
        return { message: "Password changed successfully" };
    }
    async getSessions(userId, query) {
        this.ensureUserId(userId);
        const parsed = dto_1.GetSessionsQueryPayloadDTO.safeParse(query ?? {});
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid query", parsed.error.issues);
        }
        const sessions = await this.dependencies.sessionRepository.findByUserId(userId);
        const sortedSessions = this.sortSessions(sessions, parsed.data.orderBy ?? "createdAt");
        const limit = parsed.data.limit ?? 20;
        const offset = parsed.data.offset ?? 0;
        const paginatedSessions = sortedSessions.slice(offset, offset + limit);
        const total = sortedSessions.length;
        return {
            items: this.mapSessionsToResponse(paginatedSessions),
            total,
            page: Math.floor(offset / limit) + 1,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async revokeSession(userId, sessionId) {
        this.ensureUserId(userId);
        if (!sessionId) {
            throw new http_server_1.ValidationError("Session ID is required");
        }
        const session = await this.dependencies.sessionRepository.findById(sessionId);
        if (!session || session.userId !== userId) {
            throw new http_server_1.NotFoundError("Session");
        }
        const revoked = await this.dependencies.sessionRepository.revokeSession(sessionId);
        if (!revoked) {
            throw new Error("Failed to revoke session");
        }
        return { message: "Session revoked successfully" };
    }
    async revokeAllSessions(userId) {
        this.ensureUserId(userId);
        const count = await this.dependencies.sessionRepository.revokeAllSessionsByUserId(userId);
        return { message: `${count} session(s) revoked successfully` };
    }
    async getSettings(userId) {
        this.ensureUserId(userId);
        const settings = await this.dependencies.userSettingsRepository.findByUserId(userId);
        if (settings) {
            return settings;
        }
        return this.dependencies.userSettingsRepository.upsertByUserId(userId, {});
    }
    async updateSettings(userId, data) {
        this.ensureUserId(userId);
        const parsed = dto_1.UpdateSettingsPayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid settings data", parsed.error.issues);
        }
        return this.dependencies.userSettingsRepository.upsertByUserId(userId, parsed.data);
    }
    ensureUserId(userId) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
    }
    async ensureUserExists(userId) {
        this.ensureUserId(userId);
        const user = await this.dependencies.userRepository.findById(userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User");
        }
        return user;
    }
    async getActiveUserOrThrow(userId) {
        const user = await this.ensureUserExists(userId);
        if (user.status !== client_1.UserStatus.ACTIVE) {
            throw new http_server_1.UnauthorizedError("User account is not active");
        }
        return user;
    }
    mapToOwnProfile(user) {
        return {
            id: user.id,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            bio: user.bio,
            location: user.location,
            avatarColor: user.avatarColor,
            email: user.email,
            phone: user.phone,
            emailVerified: user.emailVerified,
            role: user.role,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
        };
    }
    sortSessions(sessions, orderBy) {
        return [...sessions].sort((left, right) => {
            return right[orderBy].getTime() - left[orderBy].getTime();
        });
    }
    mapSessionsToResponse(sessions) {
        return sessions.map((session) => ({
            id: session.id,
            userId: session.userId,
            deviceId: session.deviceId,
            deviceName: session.deviceName,
            deviceType: session.deviceType,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            isActive: session.isActive,
            expiresAt: session.expiresAt,
            lastActivityAt: session.lastActivityAt,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        }));
    }
}
exports.UserUseCase = UserUseCase;
class AdminUserUseCase {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    async listUsers(query) {
        const parsed = dto_1.ListUsersQueryPayloadDTO.safeParse(query);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid query parameters", parsed.error.issues);
        }
        return this.dependencies.userRepository.listUsers(parsed.data);
    }
    async getUserById(userId) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const user = await this.dependencies.userRepository.findById(userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User");
        }
        return user;
    }
    async createUser(data) {
        const parsed = dto_1.CreateUserPayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid user data", parsed.error.issues);
        }
        const existingUser = await this.dependencies.userRepository.findByEmail(parsed.data.email);
        if (existingUser) {
            throw new http_server_1.ValidationError("Email already exists", undefined, error_code_1.ErrorCode.EMAIL_EXISTS);
        }
        if (parsed.data.username) {
            const existingUsername = await this.dependencies.userRepository.findByUsername(parsed.data.username);
            if (existingUsername) {
                throw new http_server_1.ValidationError("Username already exists", undefined, error_code_1.ErrorCode.USERNAME_EXISTS);
            }
        }
        const userId = (0, uuid_1.v7)();
        const passwordHash = await this.dependencies.passwordHasher.hash(parsed.data.password);
        const newUser = {
            id: userId,
            email: parsed.data.email,
            name: parsed.data.name ?? null,
            username: parsed.data.username ?? null,
            password: passwordHash,
            provider: "local",
            avatar: null,
            phone: null,
            bio: null,
            location: null,
            avatarColor: null,
            role: parsed.data.role ?? "USER",
            status: parsed.data.status ?? client_1.UserStatus.ACTIVE,
            emailVerified: false,
            mustChangePassword: true,
            lastLoginAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await this.dependencies.userRepository.insert(newUser);
        await this.dependencies.notificationService.sendWelcomeEmail({
            email: newUser.email,
            name: newUser.name || newUser.username || "User",
        });
        return { userId };
    }
    async updateUser(userId, data) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const parsed = dto_1.UpdateUserPayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid user data", parsed.error.issues);
        }
        const user = await this.dependencies.userRepository.findById(userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User");
        }
        if (parsed.data.email && parsed.data.email !== user.email) {
            const existingUser = await this.dependencies.userRepository.findByEmail(parsed.data.email);
            if (existingUser) {
                throw new http_server_1.ValidationError("Email already exists", undefined, error_code_1.ErrorCode.EMAIL_EXISTS);
            }
        }
        if (parsed.data.username && parsed.data.username !== user.username) {
            const existingUsername = await this.dependencies.userRepository.findByUsername(parsed.data.username);
            if (existingUsername) {
                throw new http_server_1.ValidationError("Username already exists", undefined, error_code_1.ErrorCode.USERNAME_EXISTS);
            }
        }
        return this.dependencies.userRepository.updateProfile(userId, parsed.data);
    }
    async deleteUser(userId) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const user = await this.dependencies.userRepository.findById(userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User");
        }
        await this.dependencies.sessionRepository.revokeAllSessionsByUserId(userId);
        const deleted = await this.dependencies.userRepository.deleteUser(userId);
        if (!deleted) {
            throw new Error("Failed to delete user");
        }
        return { message: "User deleted successfully" };
    }
    async changeUserStatus(userId, data) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const parsed = dto_1.ChangeUserStatusPayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid status data", parsed.error.issues);
        }
        if (!parsed.data.status) {
            throw new http_server_1.ValidationError("Status is required");
        }
        const user = await this.dependencies.userRepository.findById(userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User");
        }
        await this.dependencies.userRepository.updateProfile(userId, {
            status: parsed.data.status,
        });
        if (parsed.data.status !== client_1.UserStatus.ACTIVE) {
            await this.dependencies.sessionRepository.revokeAllSessionsByUserId(userId);
        }
        return { message: `User status changed to ${parsed.data.status}` };
    }
    async resetUserPassword(userId, data) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const parsed = dto_1.ResetUserPasswordPayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid reset data", parsed.error.issues);
        }
        const user = await this.dependencies.userRepository.findById(userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User");
        }
        const temporaryPassword = parsed.data.tempPassword || this.generateTempPassword();
        const passwordHash = await this.dependencies.passwordHasher.hash(temporaryPassword);
        await this.dependencies.userRepository.updateProfile(userId, {
            password: passwordHash,
            mustChangePassword: true,
        });
        await this.dependencies.sessionRepository.revokeAllSessionsByUserId(userId);
        if (parsed.data.sendEmail && user.email) {
            await this.dependencies.notificationService.sendPasswordResetNotification({
                email: user.email,
                token: temporaryPassword,
            });
        }
        return { temporaryPassword };
    }
    async verifyUserEmail(userId) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const user = await this.dependencies.userRepository.findById(userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User");
        }
        if (user.emailVerified) {
            return { message: "Email already verified" };
        }
        await this.dependencies.userRepository.updateProfile(userId, {
            emailVerified: true,
        });
        return { message: "Email verified successfully" };
    }
    async revokeAllUserSessions(userId) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const count = await this.dependencies.sessionRepository.revokeAllSessionsByUserId(userId);
        return { message: `${count} session(s) revoked` };
    }
    generateTempPassword() {
        return (Math.random().toString(36).slice(2, 10).toUpperCase() +
            Math.random().toString(36).slice(2, 10).toUpperCase());
    }
}
exports.AdminUserUseCase = AdminUserUseCase;
