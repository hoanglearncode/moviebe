import { v7 } from "uuid";
import { UserStatus } from "@prisma/client";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../../share/transport/http-server";
import { ErrorCode } from "../../../share/model/error-code";
import { AuthHexagonDependencies, IAuthUseCase } from "../interface";
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
  RefreshTokenPayloadDTO
} from "../model/dto";
import { AuthResponse, AuthSocialProfile, AuthUser } from "../model/model";

export class AuthUseCase implements IAuthUseCase {
  constructor(private readonly dependencies: AuthHexagonDependencies) {}

  async register(data: RegisterDTO): Promise<{ userId: string }> {
    const parsedData = RegisterPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid registration data", parsedData.error.issues);
    }

    const { userRepository, passwordHasher, tokenService, notificationService } =
      this.dependencies;

    const existingEmail = await userRepository.findByEmail(parsedData.data.email);
    if (existingEmail) {
      throw new ValidationError("Email already exists", undefined, ErrorCode.EMAIL_EXISTS);
    }

    if (parsedData.data.username) {
      const existingUsername = await userRepository.findByUsername(
        parsedData.data.username
      );

      if (existingUsername) {
        throw new ValidationError("Username already exists", undefined, ErrorCode.USERNAME_EXISTS);
      }
    }

    const newUserId = v7();
    const passwordHash = await passwordHasher.hash(parsedData.data.password);
    const user: AuthUser = {
      id: newUserId,
      email: parsedData.data.email,
      username: parsedData.data.username ?? null,
      name: parsedData.data.name ?? null,
      password: passwordHash,
      emailVerified: false,
      mustChangePassword: false,
      status: UserStatus.ACTIVE,
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

  async login(
    data: LoginDTO
  ): Promise<AuthResponse> {
    const parsedData = LoginPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid login data", parsedData.error.issues);
    }

    const { userRepository, passwordHasher, tokenService } = this.dependencies;

    const user = await userRepository.findByEmailOrUsername(
      parsedData.data.emailOrUsername
    );

    if (!user) {
      throw new UnauthorizedError("Invalid credentials", ErrorCode.INVALID_CREDENTIALS);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError("Account is unavailable", ErrorCode.ACCOUNT_INACTIVE);
    }

    const isPasswordMatched = await passwordHasher.compare(
      parsedData.data.password,
      user.password || ""
    );

    if (!isPasswordMatched) {
      throw new UnauthorizedError("Invalid credentials", ErrorCode.INVALID_CREDENTIALS);
    }

    if (!user.emailVerified) {
      throw new UnauthorizedError("Account is not verified", ErrorCode.ACCOUNT_NOT_VERIFIED);
    }

    const session = await tokenService.issueAuthSession(user);

    return this.buildAuthResponse(user, session);
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

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError("Account is unavailable", ErrorCode.ACCOUNT_INACTIVE);
    }

    return this.buildAuthResponse(user, session);
  }

  async loginGoogle(data: GoogleDTO): Promise<AuthResponse> {
    const parsedData = GoogleLoginPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid Google login data", parsedData.error.issues);
    }

    const profile = await this.dependencies.socialAuthService.verifyGoogleCredential(
      parsedData.data.credential
    );

    return this.loginWithSocialProfile(profile);
  }

  async loginGoogleTokenCallback(data: GoogleTokenDTO): Promise<AuthResponse> {
    const parsedData = GoogleLoginTokenCallbackPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError(
        "Invalid Google token callback data",
        parsedData.error.issues
      );
    }

    const profile = await this.dependencies.socialAuthService.getGoogleProfile(
      parsedData.data.accessToken
    );

    return this.loginWithSocialProfile(profile);
  }

  async loginFacebook(data: FacebookTO): Promise<AuthResponse> {
    const parsedData = FacebookLoginPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid Facebook login data", parsedData.error.issues);
    }

    const profile = await this.dependencies.socialAuthService.getFacebookProfile(
      parsedData.data.accessToken
    );

    return this.loginWithSocialProfile(profile);
  }

  async verifyEmail(data: VerifyEmailDTO): Promise<{ message: string }> {
    const parsedData = VerifyEmailPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid verification data", parsedData.error.issues);
    }

    const { tokenService, userRepository } = this.dependencies;

    const { userId } = await tokenService.verifyActionToken(
      parsedData.data.token,
      "verify-email"
    );

    const user = await userRepository.get(userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    await userRepository.markVerified(userId);

    return { message: "Email verified successfully" };
  }

  async resendVerification(data: ResendVerificationDTO): Promise<{ message: string }> {
    const parsedData = ResendVerificationPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid resend verification data", parsedData.error.issues);
    }

    const { userRepository, tokenService, notificationService } = this.dependencies;

    const user = await userRepository.findByEmail(parsedData.data.email);
    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.emailVerified) {
      throw new ValidationError("Email is already verified");
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

    const { tokenService, userRepository, passwordHasher } = this.dependencies;

    const { userId } = await tokenService.verifyActionToken(
      parsedData.data.token,
      "reset-password"
    );

    const user = await userRepository.get(userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    const newPasswordHash = await passwordHasher.hash(parsedData.data.newPassword);
    await userRepository.updatePassword(userId, newPasswordHash);
    if(!user.emailVerified) await userRepository.markVerified(userId);

    return { message: "Password changed successfully" };
  }

  private async loginWithSocialProfile(profile: AuthSocialProfile): Promise<AuthResponse> {
    const { userRepository, tokenService } = this.dependencies;

    let user = await userRepository.findByEmail(profile.email);

    if (!user) {
      const newUserId = v7();
      user = {
        id: newUserId,
        email: profile.email,
        name: profile.name ?? null,
        username: null,
        password: null,
        avatar: profile.avatar ?? null,
        provider: profile.provider,
        emailVerified: profile.emailVerified,
        mustChangePassword: false,
        status: UserStatus.ACTIVE,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await userRepository.insert(user);
    } else {
      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedError("Account is unavailable", ErrorCode.ACCOUNT_INACTIVE);
      }

      await userRepository.update(user.id, {
        name: user.name ?? profile.name ?? null,
        avatar: profile.avatar ?? null,
        provider: profile.provider,
        emailVerified: user.emailVerified || profile.emailVerified,
        lastLoginAt: new Date(),
      });

      user = await userRepository.get(user.id);
      if (!user) {
        throw new NotFoundError("User");
      }
    }

    const session = await tokenService.issueAuthSession(user);
    return this.buildAuthResponse(user, session);
  }

  private buildAuthResponse(
    user: AuthUser,
    session: { accessToken: string; refreshToken: string }
  ): AuthResponse {
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        emailVerified: user.emailVerified,
        mustChangePassword: user.mustChangePassword
      },
    };
  }
}
