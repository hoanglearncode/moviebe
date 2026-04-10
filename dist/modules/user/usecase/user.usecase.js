"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserUseCase = void 0;
const errors_1 = require("../model/errors");
class UserUseCase {
    constructor(deps) {
        this.userRepo = deps.userRepository;
        this.sessionRepo = deps.sessionRepository;
        this.settingsRepo = deps.userSettingsRepository;
        this.hasher = deps.passwordHasher;
        this.notifier = deps.notificationService;
    }
    async getProfile(userId) {
        const user = await this.userRepo.findById(userId);
        if (!user)
            throw errors_1.ErrUserNotFound;
        return this.toOwnProfile(user);
    }
    async updateProfile(userId, data) {
        const user = await this.userRepo.findById(userId);
        if (!user)
            throw errors_1.ErrUserNotFound;
        const updated = await this.userRepo.updateProfile(userId, data);
        return this.toOwnProfile(updated);
    }
    async deleteAccount(userId) {
        const user = await this.userRepo.findById(userId);
        if (!user)
            throw errors_1.ErrUserNotFound;
        await this.sessionRepo.revokeAllSessionsByUserId(userId);
        // Hard delete vì user tự xoá tài khoản của mình
        await this.userRepo.delete(userId, true);
        this.notifier
            .sendAccountDeletedNotification({ email: user.email, name: user.name ?? user.email })
            .catch(console.error);
        return { message: "Account deleted successfully" };
    }
    async changePassword(userId, data) {
        const user = await this.userRepo.findById(userId);
        if (!user)
            throw errors_1.ErrUserNotFound;
        // Social login users không có password
        if (!user.password)
            throw errors_1.ErrPasswordUnchangeable;
        const isValid = await this.hasher.compare(data.currentPassword, user.password);
        if (!isValid)
            throw errors_1.ErrPasswordInvalid;
        const newHash = await this.hasher.hash(data.newPassword);
        await this.userRepo.updatePassword(userId, newHash);
        await this.sessionRepo.revokeAllSessionsByUserId(userId);
        this.notifier
            .sendPasswordChangeConfirmation({ email: user.email, name: user.name ?? user.email })
            .catch(console.error);
        return { message: "Password changed successfully" };
    }
    async getSessions(userId, query) {
        const sessions = await this.sessionRepo.findByUserId(userId);
        // Ẩn refreshToken khỏi response
        const items = sessions.map(({ refreshToken, ...rest }) => rest);
        return { items, total: items.length, page: 1, limit: items.length, totalPages: 1 };
    }
    async revokeSession(userId, sessionId) {
        const session = await this.sessionRepo.findById(sessionId);
        if (!session)
            throw errors_1.ErrSessionNotFound;
        // Security: chỉ được revoke session của chính mình
        if (session.userId !== userId)
            throw errors_1.ErrSessionUnauthorized;
        await this.sessionRepo.revokeSession(sessionId);
        return { message: "Session revoked successfully" };
    }
    async revokeAllSessions(userId) {
        const count = await this.sessionRepo.revokeAllSessionsByUserId(userId);
        return { message: `Revoked ${count} session(s)` };
    }
    async getSettings(userId) {
        // Lazy init: tạo default nếu chưa có
        return this.settingsRepo.upsertByUserId(userId, {});
    }
    async updateSettings(userId, data) {
        return this.settingsRepo.upsertByUserId(userId, data);
    }
    toOwnProfile(user) {
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            status: user.status,
            bio: user.bio,
            location: user.location,
            avatarColor: user.avatarColor,
            phone: user.phone,
            emailVerified: user.emailVerified,
            role: user.role,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
        };
    }
}
exports.UserUseCase = UserUseCase;
