import { IUserUseCase, UserHexagonDependencies } from "../interface";
import { ChangePasswordDTO, GetSessionsQueryDTO, UpdateProfileDTO } from "../model/dto";
import {
  ErrPasswordInvalid,
  ErrPasswordUnchangeable,
  ErrSessionNotFound,
  ErrSessionUnauthorized,
  ErrUserNotFound,
} from "../model/errors";
import { OwnUserProfile, SessionListResponse } from "../model/model";
import { AuthorizationUseCase } from "./authorization.usecase";

export class UserUseCase implements IUserUseCase {
  private readonly userRepo: UserHexagonDependencies["userRepository"];
  private readonly sessionRepo: UserHexagonDependencies["sessionRepository"];
  private readonly hasher: UserHexagonDependencies["passwordHasher"];
  private readonly notifier: UserHexagonDependencies["notificationService"];
  private readonly authorizationUseCase = new AuthorizationUseCase();

  constructor(deps: UserHexagonDependencies) {
    this.userRepo = deps.userRepository;
    this.sessionRepo = deps.sessionRepository;
    this.hasher = deps.passwordHasher;
    this.notifier = deps.notificationService;
  }

  async getProfile(userId: string): Promise<OwnUserProfile> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ErrUserNotFound;
    return this.toOwnProfile(user);
  }

  async updateProfile(userId: string, data: UpdateProfileDTO): Promise<OwnUserProfile> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ErrUserNotFound;

    const updated = await this.userRepo.updateProfile(userId, data);
    return this.toOwnProfile(updated);
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ErrUserNotFound;

    await this.sessionRepo.revokeAllSessionsByUserId(userId);
    // Hard delete vì user tự xoá tài khoản của mình
    await this.userRepo.delete(userId, true);

    this.notifier
      .sendAccountDeletedNotification({ email: user.email, name: user.name ?? user.email })
      .catch(console.error);

    return { message: "Account deleted successfully" };
  }

  async changePassword(userId: string, data: ChangePasswordDTO): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ErrUserNotFound;

    // Social login users không có password
    if (!user.password) throw ErrPasswordUnchangeable;

    const isValid = await this.hasher.compare(data.currentPassword, user.password);
    if (!isValid) throw ErrPasswordInvalid;

    const newHash = await this.hasher.hash(data.newPassword);
    await this.userRepo.updatePassword(userId, newHash);
    await this.sessionRepo.revokeAllSessionsByUserId(userId);

    this.notifier
      .sendPasswordChangeConfirmation({ email: user.email, name: user.name ?? user.email })
      .catch(console.error);

    return { message: "Password changed successfully" };
  }

  async getSessions(userId: string, query?: GetSessionsQueryDTO): Promise<SessionListResponse> {
    const sessions = await this.sessionRepo.findByUserId(userId);
    // Ẩn refreshToken khỏi response
    const items = sessions.map(({ refreshToken, ...rest }) => rest);
    return { items, total: items.length, page: 1, limit: items.length, totalPages: 1 };
  }

  async revokeSession(userId: string, sessionId: string): Promise<{ message: string }> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw ErrSessionNotFound;

    // Security: chỉ được revoke session của chính mình
    if (session.userId !== userId) throw ErrSessionUnauthorized;

    await this.sessionRepo.revokeSession(sessionId);
    return { message: "Session revoked successfully" };
  }

  async revokeAllSessions(userId: string): Promise<{ message: string }> {
    const count = await this.sessionRepo.revokeAllSessionsByUserId(userId);
    return { message: `Revoked ${count} session(s)` };
  }

  private toOwnProfile(user: any): OwnUserProfile {
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
      permissionsOverride: user.permissionsOverride,
      permissions: this.authorizationUseCase.resolvePermissions({
        role: user.role,
        permissionsOverride: user.permissionsOverride,
      }),
      provider: user.provider || "local",
    };
  }
}
