import {
  ChangePasswordDTO,
  ForgotPasswordDTO,
  LoginDTO,
  RegisterDTO,
  ResendVerificationDTO,
  VerifyEmailDTO,
} from "../model/dto";
import {
  AuthActionTokenPurpose,
  AuthPublicUser,
  AuthSession,
  AuthUser,
} from "../model/model";

export interface IAuthUserRepository {
  getById(id: string): Promise<AuthUser | null>;
  findByEmail(email: string): Promise<AuthUser | null>;
  findByUsername(username: string): Promise<AuthUser | null>;
  findByEmailOrUsername(identifier: string): Promise<AuthUser | null>;
  insert(user: AuthUser): Promise<boolean>;
  markVerified(userId: string): Promise<boolean>;
  updatePassword(userId: string, passwordHash: string): Promise<boolean>;
}

export interface IPasswordHasher {
  hash(rawValue: string): Promise<string>;
  compare(rawValue: string, hashedValue: string): Promise<boolean>;
}

export interface ITokenService {
  issueAuthSession(user: AuthUser): Promise<AuthSession>;
  issueActionToken(payload: {
    userId: string;
    purpose: AuthActionTokenPurpose;
  }): Promise<string>;
  verifyActionToken(token: string, purpose: AuthActionTokenPurpose): Promise<{
    userId: string;
  }>;
}

export interface IAuthNotificationService {
  sendVerifyEmail(input: { email: string; token: string }): Promise<void>;
  sendResetPasswordEmail(input: {
    email: string;
    token: string;
  }): Promise<void>;
}

export interface IAuthUseCase {
  register(data: RegisterDTO): Promise<{ userId: string }>;
  login(data: LoginDTO): Promise<AuthSession & { user: AuthPublicUser }>;
  verifyEmail(data: VerifyEmailDTO): Promise<boolean>;
  resendVerification(data: ResendVerificationDTO): Promise<boolean>;
  forgotPassword(data: ForgotPasswordDTO): Promise<boolean>;
  changePassword(data: ChangePasswordDTO): Promise<boolean>;
}

export type AuthHexagonDependencies = {
  userRepository: IAuthUserRepository;
  passwordHasher: IPasswordHasher;
  tokenService: ITokenService;
  notificationService: IAuthNotificationService;
};
