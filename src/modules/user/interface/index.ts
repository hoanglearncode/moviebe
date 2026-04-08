import { IRepository } from "../../../share/interface";
import {
  UpdateProfileDTO,
  ChangePasswordDTO,
  GetSettingsDTO,
  UpdateSettingsDTO,
  GetSessionsQueryDTO,
  RevokeSessionDTO,
  CreateUserDTO,
  UpdateUserDTO,
  ChangeUserStatusDTO,
  ResetUserPasswordDTO,
  ListUsersQueryDTO,
} from "../model/dto";
import {
  UserProfile,
  UserSession,
  UserSettings,
  SessionListResponse,
  UserListResponse,
  OwnUserProfile,
} from "../model/model";

/**
 * ==========================================
 * USER PROFILE REPOSITORIES
 * ==========================================
 */

export interface IUserRepository extends IRepository<UserProfile, Partial<UserProfile>, Partial<UserProfile>> {
  findById(userId: string): Promise<UserProfile | null>;
  findByEmail(email: string): Promise<UserProfile | null>;
  findByUsername(username: string): Promise<UserProfile | null>;
  updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile>;
  deleteUser(userId: string): Promise<boolean>;
  listUsers(query: ListUsersQueryDTO): Promise<UserListResponse>;
  countUsers(): Promise<number>;
}

export interface ISessionRepository extends IRepository<UserSession, Partial<UserSession>, Partial<UserSession>> {
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
  updateByUserId(userId: string, data: Partial<UserSettings>): Promise<UserSettings>;
}

/**
 * ==========================================
 * SERVICES
 * ==========================================
 */

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

/**
 * ==========================================
 * USE CASES
 * ==========================================
 */

/**
 * IUserUseCase - User Profile & Session Management
 */
export interface IUserUseCase {
  // Profile
  getProfile(userId: string): Promise<OwnUserProfile>;
  updateProfile(userId: string, data: UpdateProfileDTO): Promise<OwnUserProfile>;
  deleteAccount(userId: string): Promise<{ message: string }>;

  // Password
  changePassword(userId: string, data: ChangePasswordDTO): Promise<{ message: string }>;

  // Sessions
  getSessions(userId: string, query?: GetSessionsQueryDTO): Promise<SessionListResponse>;
  revokeSession(userId: string, sessionId: string): Promise<{ message: string }>;
  revokeAllSessions(userId: string): Promise<{ message: string }>;

  // Settings
  getSettings(userId: string): Promise<UserSettings>;
  updateSettings(userId: string, data: UpdateSettingsDTO): Promise<UserSettings>;
}

/**
 * IAdminUserUseCase - Admin User Management
 */
export interface IAdminUserUseCase {
  // User Management
  listUsers(query: ListUsersQueryDTO): Promise<UserListResponse>;
  getUserById(userId: string): Promise<UserProfile>;
  createUser(data: CreateUserDTO): Promise<{ userId: string }>;
  updateUser(userId: string, data: UpdateUserDTO): Promise<UserProfile>;
  deleteUser(userId: string): Promise<{ message: string }>;

  // User Status & Security
  changeUserStatus(userId: string, data: ChangeUserStatusDTO): Promise<{ message: string }>;
  resetUserPassword(userId: string, data: ResetUserPasswordDTO): Promise<{ temporaryPassword: string }>;
  verifyUserEmail(userId: string): Promise<{ message: string }>;
  revokeAllUserSessions(userId: string): Promise<{ message: string }>;
}

/**
 * ==========================================
 * HEXAGON DEPENDENCIES
 * ==========================================
 */

export interface UserHexagonDependencies {
  userRepository: IUserRepository;
  sessionRepository: ISessionRepository;
  userSettingsRepository: IUserSettingsRepository;
  passwordHasher: IPasswordHasher;
  notificationService: IUserNotificationService;
}

export interface AdminUserHexagonDependencies extends UserHexagonDependencies {
  // Can extend with additional admin-specific services
}

