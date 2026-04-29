"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUseCase = void 0;
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const http_server_1 = require("../../../share/transport/http-server");
const error_code_1 = require("../../../share/model/error-code");
const value_1 = require("../../../share/common/value");
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
        return this.dependencies.concurrentLockService.runExclusive(this.getRegisterLockKeys(parsedData.data.email, parsedData.data.username), async () => {
            const { userRepository, passwordHasher, tokenService, notificationService, avatarColorService } = this.dependencies;
            const existingEmail = await userRepository.findByEmail(parsedData.data.email);
            if (existingEmail) {
                throw new http_server_1.ValidationError("Email already exists", undefined, error_code_1.ErrorCode.EMAIL_EXISTS);
            }
            if (parsedData.data.username) {
                const existingUsername = await userRepository.findByUsername(parsedData.data.username);
                if (existingUsername) {
                    throw new http_server_1.ValidationError("Username already exists", undefined, error_code_1.ErrorCode.USERNAME_EXISTS);
                }
            }
            const newUserId = (0, uuid_1.v7)();
            const passwordHash = await passwordHasher.hash(parsedData.data.password);
            const avatarColor = avatarColorService.generateAvatarColor(parsedData.data.email);
            const user = {
                id: newUserId,
                email: parsedData.data.email,
                username: parsedData.data.username ?? null,
                name: parsedData.data.name ?? null,
                password: passwordHash,
                provider: "local",
                avatar: null,
                phone: null,
                bio: null,
                location: null,
                avatarColor,
                role: client_1.Role.USER,
                emailVerified: false,
                mustChangePassword: false,
                status: client_1.UserStatus.ACTIVE,
                lastLoginAt: new Date(),
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
        }, {
            ttlMs: value_1.ENV.AUTH_CONCURRENT_LOCK_TTL_MS,
            conflictMessage: "A registration request for this account is already being processed",
        });
    }
    async login(data) {
        const parsedData = dto_1.LoginPayloadDTO.safeParse(data);
        if (!parsedData.success) {
            throw new http_server_1.ValidationError("Invalid login data", parsedData.error.issues);
        }
        return this.dependencies.concurrentLockService.runExclusive(this.getLoginLockKey(parsedData.data.emailOrUsername), async () => {
            const { userRepository, passwordHasher, tokenService } = this.dependencies;
            const user = await userRepository.findByEmailOrUsername(parsedData.data.emailOrUsername);
            if (!user) {
                throw new http_server_1.UnauthorizedError("Invalid credentials", error_code_1.ErrorCode.INVALID_CREDENTIALS);
            }
            if (user.status !== client_1.UserStatus.ACTIVE) {
                throw new http_server_1.UnauthorizedError("Account is unavailable", error_code_1.ErrorCode.ACCOUNT_INACTIVE);
            }
            const isPasswordMatched = await passwordHasher.compare(parsedData.data.password, user.password || "");
            if (!isPasswordMatched) {
                throw new http_server_1.UnauthorizedError("Invalid credentials", error_code_1.ErrorCode.INVALID_CREDENTIALS);
            }
            if (!user.emailVerified) {
                throw new http_server_1.UnauthorizedError("Account is not verified", error_code_1.ErrorCode.ACCOUNT_NOT_VERIFIED);
            }
            const session = await tokenService.issueAuthSession(user);
            await userRepository.update(user.id, {
                lastLoginAt: new Date(),
            });
            return this.buildAuthResponse(user, session);
        }, {
            ttlMs: value_1.ENV.AUTH_CONCURRENT_LOCK_TTL_MS,
            conflictMessage: "A login request for this account is already being processed",
        });
    }
    async refreshToken(data) {
        const parsedData = dto_1.RefreshTokenPayloadDTO.safeParse(data);
        if (!parsedData.success) {
            throw new http_server_1.ValidationError("Invalid refresh token data", parsedData.error.issues);
        }
        const { tokenService, userRepository } = this.dependencies;
        const session = await tokenService.refreshAuthSession(parsedData.data.refreshToken);
        const user = await userRepository.get(session.userId);
        if (!user) {
            throw new http_server_1.NotFoundError("User");
        }
        if (user.status !== client_1.UserStatus.ACTIVE) {
            throw new http_server_1.UnauthorizedError("Account is unavailable", error_code_1.ErrorCode.ACCOUNT_INACTIVE);
        }
        return this.buildAuthResponse(user, session);
    }
    async loginGoogle(data) {
        const parsedData = dto_1.GoogleLoginPayloadDTO.safeParse(data);
        if (!parsedData.success) {
            throw new http_server_1.ValidationError("Invalid Google login data", parsedData.error.issues);
        }
        const profile = await this.dependencies.socialAuthService.verifyGoogleCredential(parsedData.data.credential);
        return this.loginWithSocialProfile(profile);
    }
    async loginGoogleTokenCallback(data) {
        const parsedData = dto_1.GoogleLoginTokenCallbackPayloadDTO.safeParse(data);
        if (!parsedData.success) {
            throw new http_server_1.ValidationError("Invalid Google token callback data", parsedData.error.issues);
        }
        const profile = await this.dependencies.socialAuthService.getGoogleProfile(parsedData.data.accessToken);
        return this.loginWithSocialProfile(profile);
    }
    async loginFacebook(data) {
        const parsedData = dto_1.FacebookLoginPayloadDTO.safeParse(data);
        if (!parsedData.success) {
            throw new http_server_1.ValidationError("Invalid Facebook login data", parsedData.error.issues);
        }
        const profile = await this.dependencies.socialAuthService.getFacebookProfile(parsedData.data.accessToken);
        return this.loginWithSocialProfile(profile);
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
        await userRepository.update(userId, { mustChangePassword: false });
        if (!user.emailVerified)
            await userRepository.markVerified(userId);
        return { message: "Password changed successfully" };
    }
    async loginWithSocialProfile(profile) {
        return this.dependencies.concurrentLockService.runExclusive(this.getRegisterLockKeys(profile.email), async () => {
            const { userRepository, tokenService, avatarColorService } = this.dependencies;
            let user = await userRepository.findByEmail(profile.email);
            if (!user) {
                const newUserId = (0, uuid_1.v7)();
                const avatarColor = avatarColorService.generateAvatarColor(profile.email);
                user = {
                    id: newUserId,
                    email: profile.email,
                    name: profile.name ?? null,
                    username: null,
                    password: null,
                    provider: profile.provider,
                    avatar: profile.avatar ?? null,
                    phone: null,
                    bio: null,
                    location: null,
                    avatarColor,
                    role: client_1.Role.USER,
                    emailVerified: profile.emailVerified,
                    mustChangePassword: false,
                    status: client_1.UserStatus.ACTIVE,
                    lastLoginAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                await userRepository.insert(user);
            }
            else {
                if (user.status !== client_1.UserStatus.ACTIVE) {
                    throw new http_server_1.UnauthorizedError("Account is unavailable", error_code_1.ErrorCode.ACCOUNT_INACTIVE);
                }
                await userRepository.update(user.id, {
                    name: user.name ?? profile.name ?? null,
                    avatar: profile.avatar ?? user.avatar ?? null,
                    provider: profile.provider,
                    emailVerified: user.emailVerified || profile.emailVerified,
                    lastLoginAt: new Date(),
                });
                user = await userRepository.get(user.id);
                if (!user) {
                    throw new http_server_1.NotFoundError("User");
                }
            }
            const session = await tokenService.issueAuthSession(user);
            return this.buildAuthResponse(user, session);
        }, {
            ttlMs: value_1.ENV.AUTH_CONCURRENT_LOCK_TTL_MS,
            conflictMessage: "A social login request for this account is already being processed",
        });
    }
    getRegisterLockKeys(email, username) {
        const keys = [`auth:register:email:${this.normalizeLockValue(email)}`];
        if (username) {
            keys.push(`auth:register:username:${this.normalizeLockValue(username)}`);
        }
        return keys;
    }
    getLoginLockKey(identifier) {
        return `auth:login:${this.normalizeLockValue(identifier)}`;
    }
    normalizeLockValue(value) {
        const normalizedValue = value.trim();
        return normalizedValue.includes("@")
            ? normalizedValue.toLowerCase()
            : normalizedValue;
    }
    buildAuthResponse(user, session) {
        return {
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                avatar: user.avatar,
                avatarColor: user.avatarColor,
                name: user.name,
                emailVerified: user.emailVerified,
                mustChangePassword: user.mustChangePassword
            },
        };
    }
}
exports.AuthUseCase = AuthUseCase;
