import { v7 } from "uuid";
import { Role, UserStatus } from "@prisma/client";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/share/transport/http-server";
import { ErrorCode } from "@/share/model/error-code";
import { ENV } from "@/share/common/value";
import { AuthHexagonDependencies, IAuthUseCase } from "@/modules/auth/interface";
import {
  ChangePasswordDTO,
  ChangePasswordPayloadDTO,
  FacebookLoginPayloadDTO,
  FacebookTO,
  ForgotPasswordDTO,
  ForgotPasswordPayloadDTO,
  GoogleDTO,
  GoogleLoginPayloadDTO,
  GoogleLoginTokenCallbackPayloadDTO,
  GoogleTokenDTO,
  LoginDTO,
  LoginPayloadDTO,
  RefreshDTO,
  RegisterDTO,
  RegisterPayloadDTO,
  ResendVerificationDTO,
  ResendVerificationPayloadDTO,
  VerifyEmailDTO,
  VerifyEmailPayloadDTO,
  RefreshTokenPayloadDTO,
} from "@/modules/auth/model/dto";
import { AuthResponse, AuthSocialProfile, AuthUser } from "@/modules/auth/model/model";
import { AuthorizationUseCase } from "@/modules/admin-manage/admin-user/usecase/authorization.usecase";
import { getSystemSettingsService } from "@/modules/admin-manage/admin-system-settings";
import {
  PERMANENT_LOGIN_LOCK_STAGE,
  applyLoginLock,
  clearLoginLockStateOnSuccess,
  getLoginLockStage,
  incrementLoginFailCount,
  isLoginTemporarilyLocked,
  setPermanentLoginLockStage,
} from "@/modules/auth/shared/lock";

export class AuthUseCase implements IAuthUseCase {
  constructor(private readonly dependencies: AuthHexagonDependencies) {}

  private readonly authorizationUseCase = new AuthorizationUseCase();

  private isSessionAllowedStatus(status: UserStatus): boolean {
    return status === UserStatus.ACTIVE || status === UserStatus.BANNED;
  }

  async register(data: RegisterDTO): Promise<{ userId: string }> {
    const parsedData = RegisterPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid registration data", parsedData.error.issues);
    }

    // Block new registrations when the platform has closed sign-ups.
    // Non-fatal if SystemSettingsService is not yet initialised (defaults to open).
    try {
      const isOpen = await getSystemSettingsService().isRegistrationOpen();
      if (!isOpen) {
        throw new ValidationError(
          "Registration is currently closed. Please try again later.",
          undefined,
          ErrorCode.VALIDATION,
        );
      }
    } catch (err) {
      if (err instanceof ValidationError) throw err;
      // Settings service not available — treat as open
    }

    return this.dependencies.concurrentLockService.runExclusive(
      this.getRegisterLockKeys(parsedData.data.email, parsedData.data.username),
      async () => {
        const {
          userRepository,
          passwordHasher,
          tokenService,
          notificationService,
          avatarColorService,
        } = this.dependencies;

        const existingEmail = await userRepository.findByEmail(parsedData.data.email);
        if (existingEmail) {
          throw new ValidationError("Email already exists", undefined, ErrorCode.EMAIL_EXISTS);
        }

        if (parsedData.data.username) {
          const existingUsername = await userRepository.findByUsername(parsedData.data.username);

          if (existingUsername) {
            throw new ValidationError(
              "Username already exists",
              undefined,
              ErrorCode.USERNAME_EXISTS,
            );
          }
        }

        const newUserId = v7();
        const passwordHash = await passwordHasher.hash(parsedData.data.password);
        const avatarColor = avatarColorService.generateAvatarColor(parsedData.data.email);
        const user: AuthUser = {
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
          role: Role.USER,
          emailVerified: false,
          mustChangePassword: false,
          status: UserStatus.ACTIVE,
          permissions_override: parsedData.data.permissions_override,
          lastLoginAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await userRepository.insert(user);

        if (this.dependencies.userSettingService) {
          try {
            await this.dependencies.userSettingService.default(newUserId);
          } catch (error) {
            console.error(`Failed to create default settings for user ${newUserId}:`, error);
          }
        }

        const verifyToken = await tokenService.issueActionToken({
          userId: newUserId,
          purpose: "verify-email",
        });

        await notificationService.sendVerifyEmail({
          email: user.email,
          token: verifyToken,
        });

        return { userId: newUserId };
      },
      {
        ttlMs: ENV.AUTH_CONCURRENT_LOCK_TTL_MS,
        conflictMessage: "A registration request for this account is already being processed",
      },
    );
  }

  async login(
    data: LoginDTO,
    context?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponse> {
    const parsedData = LoginPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid login data", parsedData.error.issues);
    }

    return this.dependencies.concurrentLockService.runExclusive(
      this.getLoginLockKey(parsedData.data.emailOrUsername),
      async () => {
        const { userRepository, passwordHasher, tokenService } = this.dependencies;

        const user = await userRepository.findByEmailOrUsername(parsedData.data.emailOrUsername);

        if (!user) {
          throw new UnauthorizedError("Invalid credentials", ErrorCode.INVALID_CREDENTIALS);
        }

        if (user.status === UserStatus.INACTIVE) {
          throw new UnauthorizedError("Invalid credentials", ErrorCode.INVALID_CREDENTIALS);
        }

        if (!this.isSessionAllowedStatus(user.status)) {
          throw new UnauthorizedError("Account is unavailable", ErrorCode.ACCOUNT_INACTIVE);
        }

        if (await isLoginTemporarilyLocked(user.id)) {
          throw new UnauthorizedError(
            "Account is temporarily locked due to repeated failed login attempts",
            ErrorCode.ACCOUNT_INACTIVE,
          );
        }

        const isPasswordMatched = await passwordHasher.compare(
          parsedData.data.password,
          user.password || "",
        );

        if (!isPasswordMatched) {
          const attemptCount = await incrementLoginFailCount(user.id);
          if (attemptCount >= 5) {
            const currentStage = await getLoginLockStage(user.id);
            const nextStage = Math.min(currentStage + 1, PERMANENT_LOGIN_LOCK_STAGE);

            if (nextStage >= PERMANENT_LOGIN_LOCK_STAGE) {
              await this.dependencies.userRepository.update(user.id, {
                status: "LOCKED" as UserStatus,
              });
              await setPermanentLoginLockStage(user.id);
              throw new UnauthorizedError(
                "Account locked permanently due to repeated failed login attempts",
                ErrorCode.ACCOUNT_INACTIVE,
              );
            }

            await applyLoginLock(user.id, nextStage);
            throw new UnauthorizedError(
              "Account temporarily locked due to repeated failed login attempts",
              ErrorCode.ACCOUNT_INACTIVE,
            );
          }

          throw new UnauthorizedError("Invalid credentials", ErrorCode.INVALID_CREDENTIALS);
        }

        if (!user.emailVerified) {
          throw new UnauthorizedError("Account is not verified", ErrorCode.ACCOUNT_NOT_VERIFIED);
        }

        await clearLoginLockStateOnSuccess(user.id);

        const session = await tokenService.issueAuthSession(user, context, {
          remember: parsedData.data.remember,
        });
        await userRepository.update(user.id, {
          lastLoginAt: new Date(),
        });
        return this.buildAuthResponse(user, session);
      },
      {
        ttlMs: ENV.AUTH_CONCURRENT_LOCK_TTL_MS,
        conflictMessage: "A login request for this account is already being processed",
      },
    );
  }

  async refreshToken(data: RefreshDTO): Promise<AuthResponse> {
    const parsedData = RefreshTokenPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid refresh token data", parsedData.error.issues);
    }

    const { tokenService, userRepository } = this.dependencies;
    const session = await tokenService.refreshAuthSession(parsedData.data.refreshToken);
    const user = await userRepository.get(session.userId);

    if (!user) {
      throw new NotFoundError("User");
    }

    if (!this.isSessionAllowedStatus(user.status)) {
      throw new UnauthorizedError("Account is unavailable", ErrorCode.ACCOUNT_INACTIVE);
    }

    return this.buildAuthResponse(user, session);
  }

  async loginGoogle(
    data: GoogleDTO,
    context?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponse> {
    const parsedData = GoogleLoginPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid Google login data", parsedData.error.issues);
    }

    const profile = await this.dependencies.socialAuthService.verifyGoogleCredential(
      parsedData.data.credential,
    );

    return this.loginWithSocialProfile(profile, context);
  }

  async loginGoogleTokenCallback(
    data: GoogleTokenDTO,
    context?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponse> {
    const parsedData = GoogleLoginTokenCallbackPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid Google token callback data", parsedData.error.issues);
    }

    const profile = await this.dependencies.socialAuthService.getGoogleProfile(
      parsedData.data.accessToken,
    );

    return this.loginWithSocialProfile(profile, context);
  }

  async loginFacebook(
    data: FacebookTO,
    context?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponse> {
    const parsedData = FacebookLoginPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid Facebook login data", parsedData.error.issues);
    }

    const profile = await this.dependencies.socialAuthService.getFacebookProfile(
      parsedData.data.accessToken,
    );

    return this.loginWithSocialProfile(profile, context);
  }

  async verifyEmail(data: VerifyEmailDTO): Promise<{ message: string }> {
    const { notificationService } = this.dependencies;
    const parsedData = VerifyEmailPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid verification data", parsedData.error.issues);
    }

    const { tokenService, userRepository } = this.dependencies;

    const { userId } = await tokenService.verifyActionToken(parsedData.data.token, "verify-email");

    const user = await userRepository.get(userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    await userRepository.markVerified(userId);
    await notificationService.sendWellComeEmail(user.email);

    return { message: "Email verified successfully" };
  }

  async resendVerification(data: ResendVerificationDTO): Promise<{ message: string }> {
    const parsedData = ResendVerificationPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid resend verification data", parsedData.error.issues);
    }

    const { userRepository, tokenService, notificationService } = this.dependencies;

    const user = await userRepository.findByEmail(parsedData.data.email);
    if (!user || user.emailVerified) {
      return { message: "If the email requires verification, a new email has been sent" };
    }

    const verifyToken = await tokenService.issueActionToken({
      userId: user.id,
      purpose: "verify-email",
    });

    await notificationService.sendVerifyEmail({
      email: user.email,
      token: verifyToken,
    });

    return { message: "If the email requires verification, a new email has been sent" };
  }

  async forgotPassword(data: ForgotPasswordDTO): Promise<{ message: string }> {
    const parsedData = ForgotPasswordPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid forgot password data", parsedData.error.issues);
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

  async changePassword(data: ChangePasswordDTO): Promise<{ message: string }> {
    const parsedData = ChangePasswordPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid change password data", parsedData.error.issues);
    }

    const { tokenService, userRepository, passwordHasher, notificationService } = this.dependencies;

    const { userId } = await tokenService.verifyActionToken(
      parsedData.data.token,
      "reset-password",
    );

    const user = await userRepository.get(userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    const newPasswordHash = await passwordHasher.hash(parsedData.data.newPassword);
    await userRepository.updatePassword(userId, newPasswordHash);
    await userRepository.update(userId, { mustChangePassword: false });
    if (!user.emailVerified) await userRepository.markVerified(userId);
    await notificationService.sendChangePasswordEmail(user.email);
    return { message: "Password changed successfully" };
  }

  private async loginWithSocialProfile(
    profile: AuthSocialProfile,
    context?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponse> {
    return this.dependencies.concurrentLockService.runExclusive(
      this.getRegisterLockKeys(profile.email),
      async () => {
        const { userRepository, tokenService, avatarColorService, notificationService } =
          this.dependencies;

        let user = await userRepository.findByEmail(profile.email);

        if (!user) {
          const newUserId = v7();
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
            role: Role.USER,
            emailVerified: profile.emailVerified,
            mustChangePassword: false,
            permissions_override: profile.permissions_override,
            status: UserStatus.ACTIVE,
            lastLoginAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await userRepository.insert(user);

          if (this.dependencies.userSettingService) {
            try {
              await this.dependencies.userSettingService.default(newUserId);
            } catch (error) {
              console.error(`Failed to create default settings for user ${newUserId}:`, error);
            }
          }
          await notificationService.sendWellComeEmail(user.email);
        } else {
          if (!this.isSessionAllowedStatus(user.status)) {
            throw new UnauthorizedError("Account is unavailable", ErrorCode.ACCOUNT_INACTIVE);
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
            throw new NotFoundError("User");
          }
        }

        const session = await tokenService.issueAuthSession(user, context);
        return this.buildAuthResponse(user, session);
      },
      {
        ttlMs: ENV.AUTH_CONCURRENT_LOCK_TTL_MS,
        conflictMessage: "A social login request for this account is already being processed",
      },
    );
  }

  private getRegisterLockKeys(email: string, username?: string): string[] {
    const keys = [`auth:register:email:${this.normalizeLockValue(email)}`];

    if (username) {
      keys.push(`auth:register:username:${this.normalizeLockValue(username)}`);
    }

    return keys;
  }

  private getLoginLockKey(identifier: string): string {
    return `auth:login:${this.normalizeLockValue(identifier)}`;
  }

  private normalizeLockValue(value: string): string {
    const normalizedValue = value.trim();
    return normalizedValue.includes("@") ? normalizedValue.toLowerCase() : normalizedValue;
  }

  private buildAuthResponse(
    user: AuthUser,
    session: { accessToken: string; refreshToken: string },
  ): AuthResponse {
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        avatarColor: user.avatarColor,
        name: user.name,
        emailVerified: user.emailVerified,
        mustChangePassword: user.mustChangePassword,
        provider: user.provider,
        permissions_override: user.permissions_override,
        permissions: this.authorizationUseCase.resolvePermissions({
          role: user.role,
          permissionsOverride: user.permissions_override,
        }),
      },
    };
  }
}
