import { IRepository, IUseCase } from "../../../share/interface";
import { PagingDTO } from "../../../share/model/paging";
import { PrismaClient } from "@prisma/client";
import {
  UpdateProfileDTO, ChangePasswordDTO, UpdateSettingsDTO,
  GetSessionsQueryDTO, CreateUserDTO, UpdateUserDTO,
  ChangeUserStatusDTO, ResetUserPasswordDTO, ListUsersQueryDTO, UserCondDTO,
  SeedUsersDTO,
} from "../model/dto";
import {
  UserProfile, UserSession, UserSettings,
  SessionListResponse, OwnUserProfile, UserListResponse,
} from "../model/model";
import { SeedSummary } from "../shared/seed.service";

// ==========================================
// REPOSITORIES
// ==========================================

export interface IUserRepository
  // NOTE: IRepository<Entity, Cond, UpdateDTO>
  // Cond = Partial<UserProfile> cho các method generic (get, findByCond, list, insert, update, delete)
  extends IRepository<UserProfile, Partial<UserProfile>, Partial<UserProfile>> {

  // Domain-specific methods — ngoài những gì base interface đã có
  findById(userId: string): Promise<UserProfile | null>;
  findByEmail(email: string): Promise<UserProfile | null>;
  findByUsername(username: string): Promise<UserProfile | null>;
  updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile>;
  updatePassword(userId: string, passwordHash: string): Promise<boolean>;
  deleteUser(userId: string): Promise<boolean>;
  countUsers(): Promise<number>;

  // NOTE: Tại sao cần listUsers riêng?
  // base IRepository.list(cond: Partial<UserProfile>, paging) quá generic
  // Admin cần filter bằng ListUsersQueryDTO (keyword, role, status, sortBy...)
  // Không thể dùng Partial<UserProfile> cho keyword search nhiều field.
  listUsers(cond: ListUsersQueryDTO): Promise<{ items: OwnUserProfile[]; total: number }>;
}

export interface ISessionRepository
  extends IRepository<UserSession, Partial<UserSession>, Partial<UserSession>> {
  findById(sessionId: string): Promise<UserSession | null>;
  findByUserId(userId: string): Promise<UserSession[]>;
  revokeSession(sessionId: string): Promise<boolean>;
  revokeAllSessionsByUserId(userId: string): Promise<number>;
  findActiveSession(sessionId: string): Promise<UserSession | null>;
  deleteExpiredSessions(): Promise<number>;
}

export interface IUserSettingsRepository
  extends IRepository<UserSettings, Partial<UserSettings>, Partial<UserSettings>> {
  findByUserId(userId: string): Promise<UserSettings | null>;
  upsertByUserId(userId: string, data: Partial<UserSettings>): Promise<UserSettings>;
}

// ==========================================
// SERVICES
// ==========================================

export interface IPasswordHasher {
  hash(rawValue: string): Promise<string>;
  compare(rawValue: string, hashedValue: string): Promise<boolean>;
}

export interface IUserNotificationService {
  sendPasswordChangeConfirmation(input: { email: string; name: string }): Promise<void>;
  sendAccountDeletedNotification(input: { email: string; name: string }): Promise<void>;
  sendPasswordResetNotification(input: { email: string; token: string }): Promise<void>;
  sendWelcomeEmail(input: { email: string; name: string }): Promise<void>;
}

// ==========================================
// USE CASES
// ==========================================

export interface IUserUseCase {
  getProfile(userId: string): Promise<OwnUserProfile>;
  updateProfile(userId: string, data: UpdateProfileDTO): Promise<OwnUserProfile>;
  deleteAccount(userId: string): Promise<{ message: string }>;
  changePassword(userId: string, data: ChangePasswordDTO): Promise<{ message: string }>;
  getSessions(userId: string, query?: GetSessionsQueryDTO): Promise<SessionListResponse>;
  revokeSession(userId: string, sessionId: string): Promise<{ message: string }>;
  revokeAllSessions(userId: string): Promise<{ message: string }>;
  getSettings(userId: string): Promise<UserSettings>;
  updateSettings(userId: string, data: UpdateSettingsDTO): Promise<UserSettings>;
}

export interface IAdminUserUseCase
  extends IUseCase<CreateUserDTO, UpdateUserDTO, OwnUserProfile, UserCondDTO> {
  listWithMeta(cond: ListUsersQueryDTO): Promise<UserListResponse>;
  changeUserStatus(userId: string, data: ChangeUserStatusDTO): Promise<{ message: string }>;
  resetUserPassword(userId: string, data: ResetUserPasswordDTO): Promise<{ temporaryPassword: string }>;
  verifyUserEmail(userId: string): Promise<{ message: string }>;
  revokeAllUserSessions(userId: string): Promise<{ message: string }>;
  seedUsers(data: SeedUsersDTO): Promise<SeedSummary>;
  clearSeedUsers(): Promise<{ deletedCount: number }>;
  getSeedStatistics(): Promise<{
    totalSeedUsers: number;
    roles: Record<string, number>;
    statuses: Record<string, number>;
  }>;
  getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    banned: number;
    pending: number;
  }>;
}

// ==========================================
// DEPENDENCY BUNDLES
// ==========================================

export interface IPasswordHasher {
  hash(rawValue: string): Promise<string>;
  compare(rawValue: string, hashedValue: string): Promise<boolean>;
}

export interface IAvatarColorService {
  generateAvatarColor(identifier: string): string;
  getRandomAvatarColor(): string;
}

export interface UserHexagonDependencies {
  userRepository: IUserRepository;
  sessionRepository: ISessionRepository;
  userSettingsRepository: IUserSettingsRepository;
  passwordHasher: IPasswordHasher;
  notificationService: IUserNotificationService;
  avatarColorService: IAvatarColorService;
}

// NOTE: Admin dùng chung dependencies với user thông thường
// Vì cùng truy cập cùng bảng DB, chỉ khác ở logic nghiệp vụ
export interface AdminUserHexagonDependencies extends UserHexagonDependencies {
  prisma: PrismaClient;
}