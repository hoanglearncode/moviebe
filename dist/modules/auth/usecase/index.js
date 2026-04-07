"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUseCase = void 0;
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const http_server_1 = require("../../../share/transport/http-server");
const dto_1 = require("../model/dto");
class AuthUseCase {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    async register(data) {
        const parsedData = dto_1.RegisterPayloadDTO.safeParse(data);
        if (!parsedData.success) {
            throw new http_server_1.ValidationError("Invalid registration data", parsedData.error.issues);
        }
        const { userRepository, passwordHasher, tokenService, notificationService } = this.dependencies;
        const existingEmail = await userRepository.findByEmail(parsedData.data.email);
        if (existingEmail) {
            throw new http_server_1.ValidationError("Email already exists");
        }
        if (parsedData.data.username) {
            const existingUsername = await userRepository.findByUsername(parsedData.data.username);
            if (existingUsername) {
                throw new http_server_1.ValidationError("Username already exists");
            }
        }
        const newUserId = (0, uuid_1.v7)();
        const passwordHash = await passwordHasher.hash(parsedData.data.password);
        const user = {
            id: newUserId,
            email: parsedData.data.email,
            username: parsedData.data.username ?? null,
            name: parsedData.data.name ?? null,
            password: passwordHash,
            emailVerified: false,
            status: client_1.UserStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await userRepository.insert(user);
        const verifyToken = await tokenService.issueActionToken({
            userId: newUserId,
            purpose: "verify-email",
        });
        await notificationService.sendVerifyEmail({
            email: user.email,
            token: verifyToken,
        });
        return { userId: newUserId };
    }
    async login(data) {
        const parsedData = dto_1.LoginPayloadDTO.safeParse(data);
        if (!parsedData.success) {
            throw new http_server_1.ValidationError("Invalid login data", parsedData.error.issues);
        }
        const { userRepository, passwordHasher, tokenService } = this.dependencies;
        const user = await userRepository.findByEmailOrUsername(parsedData.data.emailOrUsername);
        if (!user) {
            throw new http_server_1.UnauthorizedError("Invalid credentials");
        }
        if (user.status !== client_1.UserStatus.ACTIVE) {
            throw new http_server_1.UnauthorizedError("Account is unavailable");
        }
        const isPasswordMatched = await passwordHasher.compare(parsedData.data.password, user.password || "");
        if (!isPasswordMatched) {
            throw new http_server_1.UnauthorizedError("Invalid credentials");
        }
        if (!user.emailVerified) {
            throw new http_server_1.UnauthorizedError("Account is not verified");
        }
        const session = await tokenService.issueAuthSession(user);
        return {
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                name: user.name,
            },
        };
    }
    async verifyEmail(data) {
        const parsedData = dto_1.VerifyEmailPayloadDTO.safeParse(data);
        if (!parsedData.success) {
            throw new http_server_1.ValidationError("Invalid verification data", parsedData.error.issues);
        }
        const { tokenService, userRepository } = this.dependencies;
        const { userId } = await tokenService.verifyActionToken(parsedData.data.token, "verify-email");
        const user = await userRepository.get(userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User");
        }
        await userRepository.markVerified(userId);
        return { message: "Email verified successfully" };
    }
    async resendVerification(data) {
        const parsedData = dto_1.ResendVerificationPayloadDTO.safeParse(data);
        if (!parsedData.success) {
            throw new http_server_1.ValidationError("Invalid resend verification data", parsedData.error.issues);
        }
        const { userRepository, tokenService, notificationService } = this.dependencies;
        const user = await userRepository.findByEmail(parsedData.data.email);
        if (!user) {
            throw new http_server_1.NotFoundError("User");
        }
        if (user.emailVerified) {
            throw new http_server_1.ValidationError("Email is already verified");
        }
        const verifyToken = await tokenService.issueActionToken({
            userId: user.id,
            purpose: "verify-email",
        });
        await notificationService.sendVerifyEmail({
            email: user.email,
            token: verifyToken,
        });
        return { message: "Verification email sent" };
    }
    async forgotPassword(data) {
        const parsedData = dto_1.ForgotPasswordPayloadDTO.safeParse(data);
        if (!parsedData.success) {
            throw new http_server_1.ValidationError("Invalid forgot password data", parsedData.error.issues);
        }
        const { userRepository, tokenService, notificationService } = this.dependencies;
        const user = await userRepository.findByEmail(parsedData.data.email);
        if (!user) {
            // Don't reveal if email exists or not for security
            return { message: "If the email exists, a reset link has been sent" };
        }
        const resetToken = await tokenService.issueActionToken({
            userId: user.id,
            purpose: "reset-password",
        });
        await notificationService.sendResetPasswordEmail({
            email: user.email,
            token: resetToken,
        });
        return { message: "If the email exists, a reset link has been sent" };
    }
    async changePassword(data) {
        const parsedData = dto_1.ChangePasswordPayloadDTO.safeParse(data);
        if (!parsedData.success) {
            throw new http_server_1.ValidationError("Invalid change password data", parsedData.error.issues);
        }
        const { tokenService, userRepository, passwordHasher } = this.dependencies;
        const { userId } = await tokenService.verifyActionToken(parsedData.data.token, "reset-password");
        const user = await userRepository.get(userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User");
        }
        const newPasswordHash = await passwordHasher.hash(parsedData.data.newPassword);
        await userRepository.updatePassword(userId, newPasswordHash);
        return { message: "Password changed successfully" };
    }
}
exports.AuthUseCase = AuthUseCase;
