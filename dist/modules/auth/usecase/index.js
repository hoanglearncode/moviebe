"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUseCase = void 0;
const uuid_1 = require("uuid");
const base_model_1 = require("../../../share/model/base-model");
const dto_1 = require("../model/dto");
class AuthUseCase {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    async register(data) {
        const parsedData = dto_1.RegisterPayloadDTO.parse(data);
        const { userRepository, passwordHasher, tokenService, notificationService } = this.dependencies;
        const existingEmail = await userRepository.findByEmail(parsedData.email);
        if (existingEmail) {
            throw new Error("Email already exists");
        }
        if (parsedData.username) {
            const existingUsername = await userRepository.findByUsername(parsedData.username);
            if (existingUsername) {
                throw new Error("Username already exists");
            }
        }
        const newUserId = (0, uuid_1.v7)();
        const passwordHash = await passwordHasher.hash(parsedData.password);
        const user = {
            id: newUserId,
            email: parsedData.email,
            username: parsedData.username ?? null,
            name: parsedData.name ?? null,
            passwordHash,
            isVerified: false,
            status: base_model_1.ModelStatus.ACTIVE,
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
        const parsedData = dto_1.LoginPayloadDTO.parse(data);
        const { userRepository, passwordHasher, tokenService } = this.dependencies;
        const user = await userRepository.findByEmailOrUsername(parsedData.emailOrUsername);
        if (!user) {
            throw new Error("Invalid credentials");
        }
        if (user.status !== base_model_1.ModelStatus.ACTIVE) {
            throw new Error("Account is unavailable");
        }
        const isPasswordMatched = await passwordHasher.compare(parsedData.password, user.passwordHash);
        if (!isPasswordMatched) {
            throw new Error("Invalid credentials");
        }
        if (!user.isVerified) {
            throw new Error("Account is not verified");
        }
        const session = await tokenService.issueAuthSession(user);
        return {
            ...session,
            user: this.toPublicUser(user),
        };
    }
    async verifyEmail(data) {
        const parsedData = dto_1.VerifyEmailPayloadDTO.parse(data);
        const { userRepository, tokenService } = this.dependencies;
        const payload = await tokenService.verifyActionToken(parsedData.token, "verify-email");
        const user = await userRepository.getById(payload.userId);
        if (!user) {
            throw new Error("User not found");
        }
        if (user.isVerified) {
            return true;
        }
        return userRepository.markVerified(user.id);
    }
    async resendVerification(data) {
        const parsedData = dto_1.ResendVerificationPayloadDTO.parse(data);
        const { userRepository, tokenService, notificationService } = this.dependencies;
        const user = await userRepository.findByEmail(parsedData.email);
        if (!user || user.isVerified) {
            return true;
        }
        const verifyToken = await tokenService.issueActionToken({
            userId: user.id,
            purpose: "verify-email",
        });
        await notificationService.sendVerifyEmail({
            email: user.email,
            token: verifyToken,
        });
        return true;
    }
    async forgotPassword(data) {
        const parsedData = dto_1.ForgotPasswordPayloadDTO.parse(data);
        const { userRepository, tokenService, notificationService } = this.dependencies;
        const user = await userRepository.findByEmail(parsedData.email);
        if (!user) {
            return true;
        }
        const resetToken = await tokenService.issueActionToken({
            userId: user.id,
            purpose: "reset-password",
        });
        await notificationService.sendResetPasswordEmail({
            email: user.email,
            token: resetToken,
        });
        return true;
    }
    async changePassword(data) {
        const parsedData = dto_1.ChangePasswordPayloadDTO.parse(data);
        const { userRepository, tokenService, passwordHasher } = this.dependencies;
        const payload = await tokenService.verifyActionToken(parsedData.token, "reset-password");
        const user = await userRepository.getById(payload.userId);
        if (!user) {
            throw new Error("User not found");
        }
        const passwordHash = await passwordHasher.hash(parsedData.newPassword);
        return userRepository.updatePassword(user.id, passwordHash);
    }
    toPublicUser(user) {
        const { passwordHash: _passwordHash, ...publicUser } = user;
        return publicUser;
    }
}
exports.AuthUseCase = AuthUseCase;
