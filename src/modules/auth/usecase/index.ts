import { v7 } from "uuid";
import { ModelStatus } from "../../../share/model/base-model";
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
    const parsedData = RegisterPayloadDTO.parse(data);
    const { userRepository, passwordHasher, tokenService, notificationService } =
      this.dependencies;

    const existingEmail = await userRepository.findByEmail(parsedData.email);
    if (existingEmail) {
      throw new Error("Email already exists");
    }

    if (parsedData.username) {
      const existingUsername = await userRepository.findByUsername(
        parsedData.username
      );

      if (existingUsername) {
        throw new Error("Username already exists");
      }
    }

    const newUserId = v7();
    const passwordHash = await passwordHasher.hash(parsedData.password);
    const user: AuthUser = {
      id: newUserId,
      email: parsedData.email,
      username: parsedData.username ?? null,
      name: parsedData.name ?? null,
      passwordHash,
      isVerified: false,
      status: ModelStatus.ACTIVE,
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
    const parsedData = LoginPayloadDTO.parse(data);
    const { userRepository, passwordHasher, tokenService } = this.dependencies;

    const user = await userRepository.findByEmailOrUsername(
      parsedData.emailOrUsername
    );

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (user.status !== ModelStatus.ACTIVE) {
      throw new Error("Account is unavailable");
    }

    const isPasswordMatched = await passwordHasher.compare(
      parsedData.password,
      user.passwordHash
    );

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

  async verifyEmail(data: VerifyEmailDTO): Promise<boolean> {
    const parsedData = VerifyEmailPayloadDTO.parse(data);
    const { userRepository, tokenService } = this.dependencies;

    const payload = await tokenService.verifyActionToken(
      parsedData.token,
      "verify-email"
    );

    const user = await userRepository.getById(payload.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isVerified) {
      return true;
    }

    return userRepository.markVerified(user.id);
  }

  async resendVerification(data: ResendVerificationDTO): Promise<boolean> {
    const parsedData = ResendVerificationPayloadDTO.parse(data);
    const { userRepository, tokenService, notificationService } =
      this.dependencies;

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

  async forgotPassword(data: ForgotPasswordDTO): Promise<boolean> {
    const parsedData = ForgotPasswordPayloadDTO.parse(data);
    const { userRepository, tokenService, notificationService } =
      this.dependencies;

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

  async changePassword(data: ChangePasswordDTO): Promise<boolean> {
    const parsedData = ChangePasswordPayloadDTO.parse(data);
    const { userRepository, tokenService, passwordHasher } = this.dependencies;

    const payload = await tokenService.verifyActionToken(
      parsedData.token,
      "reset-password"
    );

    const user = await userRepository.getById(payload.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const passwordHash = await passwordHasher.hash(parsedData.newPassword);
    return userRepository.updatePassword(user.id, passwordHash);
  }

  private toPublicUser(user: AuthUser): AuthPublicUser {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }
}
