import { PagingDTO } from "../../../share/model/paging";
import { IAdminUserUseCase, AdminUserHexagonDependencies } from "../interface";
import { IUserSetting } from "../../../modules/system/setting/interface";
import {
  ChangeUserStatusDTO,
  CreateUserDTO,
  ListUsersQueryDTO,
  ResetUserPasswordDTO,
  UpdateUserDTO,
  SeedUsersDTO,
} from "../model/dto";
import { ErrEmailAlreadyExists, ErrUserNotFound, ErrUsernameAlreadyExists } from "../model/errors";
import { OwnUserProfile, UserListResponse } from "../model/model";
import { SeedService, SeedSummary } from "../shared/seed";
import { IAuthNotificationService, ITokenService } from "../../auth/interface"

export class AdminUserUseCase implements IAdminUserUseCase {
  private readonly userRepo: AdminUserHexagonDependencies["userRepository"];
  private readonly sessionRepo: AdminUserHexagonDependencies["sessionRepository"];
  private readonly settingsRepo: AdminUserHexagonDependencies["userSettingsRepository"];
  private readonly hasher: AdminUserHexagonDependencies["passwordHasher"];
  private readonly notifier: AdminUserHexagonDependencies["notificationService"];
  private readonly avatarColorService: AdminUserHexagonDependencies["avatarColorService"];
  private readonly prisma: AdminUserHexagonDependencies["prisma"];
  private readonly userSettingService?: IUserSetting;
  private readonly authNotifications: IAuthNotificationService;
  private readonly tokenService: ITokenService
  

  constructor(deps: AdminUserHexagonDependencies, authNotifications: IAuthNotificationService, authTokenService: ITokenService) {
    this.userRepo = deps.userRepository;
    this.sessionRepo = deps.sessionRepository;
    this.settingsRepo = deps.userSettingsRepository;
    this.hasher = deps.passwordHasher;
    this.notifier = deps.notificationService;
    this.avatarColorService = deps.avatarColorService;
    this.prisma = deps.prisma;
    this.userSettingService = deps.userSettingService;
    this.authNotifications = authNotifications;
    this.tokenService = authTokenService;
  }

  async list(cond: ListUsersQueryDTO, paging: PagingDTO): Promise<OwnUserProfile[]> {
    const mergedCond = {
      ...cond,
      page: cond.page ?? paging.page ?? 1,
      limit: cond.limit ?? paging.limit ?? 20,
    };
    const result = await this.userRepo.listUsers(mergedCond);
    return result.items;
  }

  async listWithMeta(cond: ListUsersQueryDTO): Promise<UserListResponse> {
    const result = await this.userRepo.listUsers(cond);
    return {
      items: result.items,
      total: result.total,
      page: cond.page,
      limit: cond.limit,
      totalPages: Math.ceil(result.total / cond.limit),
    };
  }

  async create(data: CreateUserDTO): Promise<string> {
    // 1. Check unique constraints
    const byEmail = await this.userRepo.findByEmail(data.email);
    if (byEmail) throw ErrEmailAlreadyExists;

    if (data.username) {
      const byUsername = await this.userRepo.findByUsername(data.username);
      if (byUsername) throw ErrUsernameAlreadyExists;
    }

    // 2. Hash password
    const passwordHash = await this.hasher.hash(data.password);

    // 3. Generate avatar color
    const avatarColor = this.avatarColorService.generateAvatarColor(data.email);

    // 4. Tạo id mới — dùng crypto.randomUUID() hoặc nanoid
    const id = crypto.randomUUID();
    const now = new Date();

    // 6. Insert user
    await this.userRepo.insert({
      id,
      email: data.email,
      name: data.name ?? null,
      username: data.username ?? null,
      password: passwordHash,
      role: data.role ?? "USER",
      status: data.status ?? "ACTIVE",
      provider: "local",
      avatar: data.avatar || null,
      phone: data.phone || null,
      bio: null,
      location: data.location || null,
      avatarColor,
      emailVerified: data.emailVerified || false,
      permissionsOverride: data.permissionsOverride,
      mustChangePassword: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });

    if (this.userSettingService) {
      this.userSettingService
        .default(id)
        .catch((error) =>
          console.error(`⚠️ Failed to create default settings for user ${id}:`, error),
        );
    }
    
    if(data.sendEmailWellCome && data.emailVerified) {
      this.notifier
        .sendWelcomeEmail({ email: data.email, name: data.name ?? data.email })
        .catch(console.error);
    }

    if(!data.emailVerified) {
      const verifyToken = await this.tokenService.issueActionToken({
        userId: id,
        purpose: "verify-email",
      });
      await this.authNotifications.sendVerifyEmail({
        email: data.email,
        token: verifyToken,
      });
    }

    return id;
  }

  async update(id: string, data: UpdateUserDTO): Promise<boolean> {
    const user = await this.userRepo.findById(id);
    if (!user) throw ErrUserNotFound;

    if (data.email && data.email !== user.email) {
      const existing = await this.userRepo.findByEmail(data.email);
      if (existing) throw ErrEmailAlreadyExists;
    }

    if (data.username && data.username !== user.username) {
      const existing = await this.userRepo.findByUsername(data.username);
      if (existing) throw ErrUsernameAlreadyExists;
    }

    return this.userRepo.update(id, {
      ...(data.email && { email: data.email }),
      ...(data.name && { name: data.name }),
      ...(data.username && { username: data.username }),
      ...(data.phone && { phone: data.phone }),
      ...(data.avatar && { avatar: data.avatar }),
      ...(data.bio && { bio: data.bio }),
      ...(data.role && { role: data.role }),
      ...(data.permissionsOverride !== undefined && {
        permissionsOverride: data.permissionsOverride,
      }),
    });
  }

  async delete(id: string): Promise<boolean> {
    const user = await this.userRepo.findById(id);
    if (!user) throw ErrUserNotFound;
    await this.sessionRepo.revokeAllSessionsByUserId(id);
    this.notifier.sendAccountDeletedNotification({ email: user.email, name: user.name ?? user.email }).catch(console.error);
    return this.userRepo.delete(id, false);
  }

  async getDetail(id: string): Promise<OwnUserProfile | null> { // pending
    const user = await this.userRepo.findById(id);
    if (!user) return null;

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
    };
  }


  async changeUserStatus(userId: string, data: ChangeUserStatusDTO): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ErrUserNotFound;

    await this.userRepo.update(userId, { status: data.status });

    if (data.status === "BANNED" || data.status === "INACTIVE") {
      await this.sessionRepo.revokeAllSessionsByUserId(userId);
    }

    return { message: `User status updated to ${data.status}` };
  }

  async resetUserPassword( // pending
    userId: string,
    data: ResetUserPasswordDTO,
  ): Promise<{ temporaryPassword: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ErrUserNotFound;

    const tempPassword = data.tempPassword ?? this.generateTempPassword();
    const hash = await this.hasher.hash(tempPassword);

    await this.userRepo.updatePassword(userId, hash);
    await this.userRepo.update(userId, { mustChangePassword: true });
    await this.sessionRepo.revokeAllSessionsByUserId(userId);

    if (data.sendEmail) {
      this.notifier
        .sendPasswordResetNotification({ email: user.email, token: tempPassword })
        .catch(console.error);
    }

    return { temporaryPassword: tempPassword };
  }

  async verifyUserEmail(userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ErrUserNotFound;

    await this.userRepo.update(userId, { emailVerified: true });
    return { message: "Email verified successfully" };
  }

  async revokeAllUserSessions(userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ErrUserNotFound;

    const count = await this.sessionRepo.revokeAllSessionsByUserId(userId);
    return { message: `Revoked ${count} session(s)` };
  }

  async seedUsers(data: SeedUsersDTO): Promise<SeedSummary> {
    const seedService = new SeedService(this.prisma, this.hasher);

    return seedService.seedUsers(
      {
        count: data.count,
        batchSize: data.batchSize || 100,
        includePhone: data.includePhone ?? true,
        includeBio: data.includeBio ?? true,
        includeLocation: data.includeLocation ?? true,
        defaultRole: data.defaultRole || "USER",
        defaultStatus: data.defaultStatus || "ACTIVE",
      },
      {
        onProgress: (created, total, percentage) => {
          console.log(`Seeding progress: ${created}/${total} (${percentage}%)`);
        },
        onError: (error) => {
          console.error(`Seed error: ${error}`);
        },
        onComplete: (summary) => {
          console.log(
            `Seed completed: ${summary.totalCreated} users created in ${summary.duration}ms`,
          );
        },
      },
    );
  }

  async clearSeedUsers(): Promise<{ deletedCount: number }> {
    const seedService = new SeedService(this.prisma, this.hasher);

    return seedService.clearSeedUsers();
  }

  async getSeedStatistics(): Promise<{
    totalSeedUsers: number;
    roles: Record<string, number>;
    statuses: Record<string, number>;
  }> {
    const seedService = new SeedService(this.prisma, this.hasher);

    return seedService.getSeedStatistics();
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    banned: number;
    pending: number;
  }> {
    const [total, active, inactive, banned, pending] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: "ACTIVE", emailVerified: true } }),
      this.prisma.user.count({ where: { status: "INACTIVE" } }),
      this.prisma.user.count({ where: { status: "BANNED" } }),
      this.prisma.user.count({ where: { status: "ACTIVE", emailVerified: false } }),
    ]);

    return {
      total,
      active,
      inactive,
      banned,
      pending,
    };
  }

  private generateTempPassword(): string {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
      "",
    );
  }
}
