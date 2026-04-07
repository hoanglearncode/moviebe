import { IRepository } from "../../../share/interface";
import {
  ChangePasswordDTO,
  FacebookTO,
  ForgotPasswordDTO,
  GoogleDTO,
  GoogleTokenDTO,
  LoginDTO,
  RefreshDTO,
  RegisterDTO,
  ResendVerificationDTO,
  VerifyEmailDTO,
} from "../model/dto";
import {
  AuthActionTokenPurpose,
  AuthResponse,
  AuthSocialProfile,
  AuthPublicUser,
  AuthSession,
  AuthUser,
} from "../model/model";

export interface IAuthUserRepository extends IRepository<AuthUser, Partial<AuthUser>, Partial<AuthUser>> {
  findByEmail(email: string): Promise<AuthUser | null>;
  findByUsername(username: string): Promise<AuthUser | null>;
  findByEmailOrUsername(identifier: string): Promise<AuthUser | null>;
  markVerified(userId: string): Promise<boolean>;
  updatePassword(userId: string, passwordHash: string): Promise<boolean>;
}

export interface IPasswordHasher {
  hash(rawValue: string): Promise<string>;
  compare(rawValue: string, hashedValue: string): Promise<boolean>;
}

export interface ITokenService {
  issueAuthSession(user: AuthUser): Promise<AuthSession>;
  refreshAuthSession(refreshToken: string): Promise<AuthSession & { userId: string }>;
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

export interface ISocialAuthService {
  verifyGoogleCredential(credential: string): Promise<AuthSocialProfile>;
  getGoogleProfile(accessToken: string): Promise<AuthSocialProfile>;
  getFacebookProfile(accessToken: string): Promise<AuthSocialProfile>;
}

export interface IAuthUseCase {
  register(data: RegisterDTO): Promise<{ userId: string }>;
  login(data: LoginDTO): Promise<AuthResponse>;
  refreshToken(data: RefreshDTO): Promise<AuthResponse>;
  loginGoogle(data: GoogleDTO): Promise<AuthResponse>;
  loginGoogleTokenCallback(data: GoogleTokenDTO): Promise<AuthResponse>;
  loginFacebook(data: FacebookTO): Promise<AuthResponse>;
  verifyEmail(data: VerifyEmailDTO): Promise<{ message: string }>;
  resendVerification(data: ResendVerificationDTO): Promise<{ message: string }>;
  forgotPassword(data: ForgotPasswordDTO): Promise<{ message: string }>;
  changePassword(data: ChangePasswordDTO): Promise<{ message: string }>;
}

export interface AuthHexagonDependencies {
  userRepository: IAuthUserRepository;
  passwordHasher: IPasswordHasher;
  tokenService: ITokenService;
  notificationService: IAuthNotificationService;
  socialAuthService: ISocialAuthService;
}
