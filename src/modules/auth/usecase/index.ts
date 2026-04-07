import { v7 } from "uuid";
import { UserStatus } from "@prisma/client";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../../share/transport/http-server";
import { AuthHexagonDependencies, IAuthUseCase } from "../interface";
import {
  ChangePasswordDTO,
  ChangePasswordPayloadDTO,
  ForgotPasswordDTO,
  ForgotPasswordPayloadDTO,
  LoginDTO,
  LoginPayloadDTO,
  RegisterDTO,
  RegisterPayloadDTO,
  ResendVerificationDTO,
  ResendVerificationPayloadDTO,
  VerifyEmailDTO,
  VerifyEmailPayloadDTO,
} from "../model/dto";
import { AuthPublicUser, AuthUser } from "../model/model";

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
      throw new ValidationError("Email already exists");
    }

    if (parsedData.data.username) {
      const existingUsername = await userRepository.findByUsername(
        parsedData.data.username
      );

      if (existingUsername) {
        throw new ValidationError("Username already exists");
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
  ): Promise<{ accessToken: string; refreshToken: string; user: AuthPublicUser }> {
    const parsedData = LoginPayloadDTO.safeParse(data);
    if (!parsedData.success) {
      throw new ValidationError("Invalid login data", parsedData.error.issues);
    }

    const { userRepository, passwordHasher, tokenService } = this.dependencies;

    const user = await userRepository.findByEmailOrUsername(
      parsedData.data.emailOrUsername
    );

    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError("Account is unavailable");
    }

    const isPasswordMatched = await passwordHasher.compare(
      parsedData.data.password,
      user.password || ""
    );

    if (!isPasswordMatched) {
      throw new UnauthorizedError("Invalid credentials");
    }

    if (!user.emailVerified) {
      throw new UnauthorizedError("Account is not verified");
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

    return { message: "Password changed successfully" };
  }
}
