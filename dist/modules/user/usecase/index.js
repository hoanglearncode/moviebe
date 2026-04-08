"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUserUseCase = exports.UserUseCase = void 0;
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const http_server_1 = require("../../../share/transport/http-server");
const error_code_1 = require("../../../share/model/error-code");
const dto_1 = require("../model/dto");
/**
 * ==========================================
 * USER USE CASE
 * ==========================================
 */
class UserUseCase {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    /**
     * Get user profile
     */
    async getProfile(userId) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const user = await this.dependencies.userRepository.findById(userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User not found");
        }
        if (user.status !== client_1.UserStatus.ACTIVE) {
            throw new http_server_1.UnauthorizedError("User account is not active");
        }
        return this.mapToOwnProfile(user);
    }
    /**
     * Update user profile
     */
    async updateProfile(userId, data) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const parsed = dto_1.UpdateProfilePayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid profile data", parsed.error.issues);
        }
        const user = await this.dependencies.userRepository.findById(userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User not found");
        }
        const updated = await this.dependencies.userRepository.updateProfile(userId, parsed.data);
        return this.mapToOwnProfile(updated);
    }
    /**
     * Delete user account
     */
    async deleteAccount(userId) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const user = await this.dependencies.userRepository.findById(userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User not found");
        }
        // Revoke all sessions
        await this.dependencies.sessionRepository.revokeAllSessionsByUserId(userId);
        // Soft delete user
        const deleted = await this.dependencies.userRepository.deleteUser(userId);
        if (!deleted) {
            throw new Error("Failed to delete user account");
        }
        // Send notification
        await this.dependencies.notificationService.sendAccountDeletedNotification({
            email: user.email,
            name: user.name || user.username || "User",
        });
        return { message: "User account deleted successfully" };
    }
    /**
     * Change password
     */
    async changePassword(userId, data) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const parsed = dto_1.ChangePasswordPayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid password data", parsed.error.issues);
        }
        const user = await this.dependencies.userRepository.findById(userId);
        if (!user || !user.password) {
            throw new http_server_1.NotFoundError("User not found");
        }
        // Verify current password
        const isValid = await this.dependencies.passwordHasher.compare(parsed.data.currentPassword, user.password);
        if (!isValid) {
            throw new http_server_1.UnauthorizedError("Current password is incorrect");
        }
        // Hash new password
        const newPasswordHash = await this.dependencies.passwordHasher.hash(parsed.data.newPassword);
        // Update password
        const updated = await this.dependencies.userRepository.updatePassword(userId, newPasswordHash);
        if (!updated) {
            throw new Error("Failed to update password");
        }
        // Revoke all other sessions for security
        await this.dependencies.sessionRepository.revokeAllSessionsByUserId(userId);
        // Send notification
        await this.dependencies.notificationService.sendPasswordChangeConfirmation({
            email: user.email,
            name: user.name || user.username || "User",
        });
        return { message: "Password changed successfully" };
    }
    /**
     * Get user sessions
     */
    async getSessions(userId, query) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const parsed = dto_1.GetSessionsQueryPayloadDTO.safeParse(query || {});
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid query", parsed.error.issues);
        }
        const sessions = await this.dependencies.sessionRepository.findByUserId(userId);
        const { limit = 20, offset = 0, orderBy = "createdAt" } = parsed.data;
        // Apply offset and limit
        const paginatedSessions = sessions.slice(offset, offset + limit);
        const total = sessions.length;
        return {
            items: this.mapSessionsToResponse(paginatedSessions),
            total,
            page: Math.floor(offset / limit) + 1,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    /**
     * Revoke single session
     */
    async revokeSession(userId, sessionId) {
        if (!userId || !sessionId) {
            throw new http_server_1.ValidationError("User ID and session ID are required");
        }
        const session = await this.dependencies.sessionRepository.findById(sessionId);
        if (!session || session.userId !== userId) {
            throw new http_server_1.NotFoundError("Session not found");
        }
        const revoked = await this.dependencies.sessionRepository.revokeSession(sessionId);
        if (!revoked) {
            throw new Error("Failed to revoke session");
        }
        return { message: "Session revoked successfully" };
    }
    /**
     * Revoke all sessions
     */
    async revokeAllSessions(userId) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const count = await this.dependencies.sessionRepository.revokeAllSessionsByUserId(userId);
        return { message: `${count} session(s) revoked successfully` };
    }
    /**
     * Get user settings
     */
    async getSettings(userId) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        let settings = await this.dependencies.userSettingsRepository.findByUserId(userId);
        if (!settings) {
            // Create default settings if not exists
            const newSettings = {
                id: (0, uuid_1.v7)(),
                userId,
                notifications: true,
                marketingEmails: false,
                pushNotifications: true,
                smsNotifications: false,
                autoplay: true,
                autoQuality: true,
                alwaysSubtitle: false,
                autoPreviews: true,
                publicWatchlist: false,
                shareHistory: false,
                personalizedRecs: true,
                referralCode: null,
                referrals: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            settings = await this.dependencies.userSettingsRepository.insert(newSettings);
        }
        return settings;
    }
    /**
     * Update user settings
     */
    async updateSettings(userId, data) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const parsed = dto_1.UpdateSettingsPayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid settings data", parsed.error.issues);
        }
        const updated = await this.dependencies.userSettingsRepository.updateByUserId(userId, parsed.data);
        return updated;
    }
    // ==================== PRIVATE HELPERS ====================
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
    mapSessionsToResponse(sessions) {
        return sessions.map((s) => ({
            id: s.id,
            userId: s.userId,
            deviceName: s.deviceName,
            deviceType: s.deviceType,
            ipAddress: s.ipAddress,
            userAgent: s.userAgent,
            isActive: s.isActive,
            expiresAt: s.expiresAt,
            lastActivityAt: s.lastActivityAt,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
        }));
    }
}
exports.UserUseCase = UserUseCase;
/**
 * ==========================================
 * ADMIN USER USE CASE
 * ==========================================
 */
class AdminUserUseCase {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    /**
     * List users with pagination and filtering
     */
    async listUsers(query) {
        const parsed = dto_1.ListUsersQueryPayloadDTO.safeParse(query);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid query parameters", parsed.error.issues);
        }
        return this.dependencies.userRepository.listUsers(parsed.data);
    }
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const user = await this.dependencies.userRepository.findById(userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User not found");
        }
        return user;
    }
    /**
     * Create user (admin)
     */
    async createUser(data) {
        const parsed = dto_1.CreateUserPayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid user data", parsed.error.issues);
        }
        // Check email exists
        const existing = await this.dependencies.userRepository.findByEmail(parsed.data.email);
        if (existing) {
            throw new http_server_1.ValidationError("Email already exists", undefined, error_code_1.ErrorCode.EMAIL_EXISTS);
        }
        // Check username if provided
        if (parsed.data.username) {
            const existingUsername = await this.dependencies.userRepository.findByUsername(parsed.data.username);
            if (existingUsername) {
                throw new http_server_1.ValidationError("Username already exists");
            }
        }
        const userId = (0, uuid_1.v7)();
        const passwordHash = await this.dependencies.passwordHasher.hash(parsed.data.password);
        const newUser = {
            id: userId,
            email: parsed.data.email,
            name: parsed.data.name || null,
            username: parsed.data.username || null,
            password: passwordHash,
            provider: "local",
            avatar: null,
            phone: null,
            bio: null,
            location: null,
            avatarColor: null,
            role: parsed.data.role || "USER",
            status: parsed.data.status || client_1.UserStatus.ACTIVE,
            emailVerified: false,
            mustChangePassword: true,
            lastLoginAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await this.dependencies.userRepository.insert(newUser);
        // Send welcome email
        await this.dependencies.notificationService.sendWelcomeEmail({
            email: newUser.email,
            name: newUser.name || "User",
        });
        return { userId };
    }
    /**
     * Update user
     */
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
            throw new http_server_1.NotFoundError("User not found");
        }
        // Check if email is already used
        if (parsed.data.email && parsed.data.email !== user.email) {
            const existing = await this.dependencies.userRepository.findByEmail(parsed.data.email);
            if (existing) {
                throw new http_server_1.ValidationError("Email already exists");
            }
        }
        // Check if username is already used
        if (parsed.data.username && parsed.data.username !== user.username) {
            const existing = await this.dependencies.userRepository.findByUsername(parsed.data.username);
            if (existing) {
                throw new http_server_1.ValidationError("Username already exists");
            }
        }
        const updated = await this.dependencies.userRepository.updateProfile(userId, parsed.data);
        return updated;
    }
    /**
     * Change user status
     */
    async changeUserStatus(userId, data) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const parsed = dto_1.ChangeUserStatusPayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid status data", parsed.error.issues);
        }
        const user = await this.dependencies.userRepository.findById(userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User not found");
        }
        await this.dependencies.userRepository.updateProfile(userId, {
            status: parsed.data.status,
        });
        // Revoke all sessions if banned/disabled
        if (parsed.data.status !== client_1.UserStatus.ACTIVE) {
            await this.dependencies.sessionRepository.revokeAllSessionsByUserId(userId);
        }
        return { message: `User status changed to ${parsed.data.status}` };
    }
    /**
     * Reset user password
     */
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
            throw new http_server_1.NotFoundError("User not found");
        }
        // Generate temporary password if not provided
        const tempPassword = parsed.data.tempPassword || this.generateTempPassword();
        const passwordHash = await this.dependencies.passwordHasher.hash(tempPassword);
        await this.dependencies.userRepository.updateProfile(userId, {
            password: passwordHash,
            mustChangePassword: true,
        });
        // Revoke all sessions
        await this.dependencies.sessionRepository.revokeAllSessionsByUserId(userId);
        // Send notification
        if (parsed.data.sendEmail && user.email) {
            await this.dependencies.notificationService.sendPasswordResetNotification({
                email: user.email,
                token: tempPassword,
            });
        }
        return { temporaryPassword: tempPassword };
    }
    /**
     * Manually verify user email
     */
    async verifyUserEmail(userId) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const user = await this.dependencies.userRepository.findById(userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User not found");
        }
        if (user.emailVerified) {
            return { message: "Email already verified" };
        }
        await this.dependencies.userRepository.updateProfile(userId, {
            emailVerified: true,
        });
        return { message: "Email verified successfully" };
    }
    /**
     * Revoke all user sessions
     */
    async revokeAllUserSessions(userId) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const count = await this.dependencies.sessionRepository.revokeAllSessionsByUserId(userId);
        return { message: `${count} session(s) revoked` };
    }
    /**
     * Delete user (soft delete)
     */
    async deleteUser(userId) {
        if (!userId) {
            throw new http_server_1.ValidationError("User ID is required");
        }
        const user = await this.dependencies.userRepository.findById(userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User not found");
        }
        // Revoke all sessions
        await this.dependencies.sessionRepository.revokeAllSessionsByUserId(userId);
        // Soft delete
        const deleted = await this.dependencies.userRepository.deleteUser(userId);
        if (!deleted) {
            throw new Error("Failed to delete user");
        }
        return { message: "User deleted successfully" };
    }
    // ==================== PRIVATE HELPERS ====================
    generateTempPassword() {
        return Math.random().toString(36).slice(2, 10).toUpperCase() +
            Math.random().toString(36).slice(2, 10).toUpperCase();
    }
}
exports.AdminUserUseCase = AdminUserUseCase;
