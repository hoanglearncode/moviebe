import { PrismaClient } from "@prisma/client";
import { BaseRepositoryPrisma, BaseQueryRepositoryPrisma, BaseCommandRepositoryPrisma } from "../../../../share/repository/generic-prisma-repo";
import { IUserRepository, ISessionRepository, IUserSettingsRepository } from "../../interface";
import { UserProfile, UserSession, UserSettings, UserListResponse } from "../../model/model";
import { ListUsersQueryDTO } from "../../model/dto";

/**
 * ==========================================
 * USER REPOSITORY
 * ==========================================
 */

export class UserRepository extends BaseRepositoryPrisma<UserProfile> implements IUserRepository {
  constructor(private prismaClient: PrismaClient) {
    const queryRepo = new BaseQueryRepositoryPrisma(prismaClient.user);
    const commandRepo = new BaseCommandRepositoryPrisma(prismaClient.user);
    super(queryRepo, commandRepo);
  }

  async findById(userId: string): Promise<UserProfile | null> {
    return this.prismaClient.user.findUnique({
      where: { id: userId },
    }) as Promise<UserProfile | null>;
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    return this.prismaClient.user.findUnique({
      where: { email },
    }) as Promise<UserProfile | null>;
  }

  async findByUsername(username: string): Promise<UserProfile | null> {
    return this.prismaClient.user.findUnique({
      where: { username },
    }) as Promise<UserProfile | null>;
  }

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    return this.prismaClient.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    }) as Promise<UserProfile>;
  }

  async deleteUser(userId: string): Promise<boolean> {
    // Soft delete by changing status
    const result = await this.prismaClient.user.update({
      where: { id: userId },
      data: {
        status: "INACTIVE",
        updatedAt: new Date(),
      },
    });
    return !!result;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<boolean> {
    const result = await this.prismaClient.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        updatedAt: new Date(),
      },
    });
    return !!result;
  }

  async listUsers(query: ListUsersQueryDTO): Promise<UserListResponse> {
    const { page, limit, keyword, email, username, role, status, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (keyword) {
      where.OR = [
        { email: { contains: keyword, mode: "insensitive" } },
        { username: { contains: keyword, mode: "insensitive" } },
        { name: { contains: keyword, mode: "insensitive" } },
      ];
    }

    if (email) where.email = email;
    if (username) where.username = username;
    if (role) where.role = role;
    if (status) where.status = status;

    // Fetch total count
    const total = await this.prismaClient.user.count({ where });

    // Fetch paginated results
    const items = await this.prismaClient.user.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }) as UserProfile[];

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async countUsers(): Promise<number> {
    return this.prismaClient.user.count();
  }
}

/**
 * ==========================================
 * SESSION REPOSITORY
 * ==========================================
 */

export class SessionRepository extends BaseRepositoryPrisma<UserSession> implements ISessionRepository {
  constructor(private prismaClient: PrismaClient) {
    const queryRepo = new BaseQueryRepositoryPrisma(prismaClient.session);
    const commandRepo = new BaseCommandRepositoryPrisma(prismaClient.session);
    super(queryRepo, commandRepo);
  }

  async findById(sessionId: string): Promise<UserSession | null> {
    return this.prismaClient.session.findUnique({
      where: { id: sessionId },
    }) as Promise<UserSession | null>;
  }

  async findByUserId(userId: string): Promise<UserSession[]> {
    return this.prismaClient.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }) as Promise<UserSession[]>;
  }

  async revokeSession(sessionId: string): Promise<boolean> {
    const result = await this.prismaClient.session.update({
      where: { id: sessionId },
      data: { isActive: false, updatedAt: new Date() },
    });
    return !!result;
  }

  async revokeAllSessionsByUserId(userId: string): Promise<number> {
    const result = await this.prismaClient.session.updateMany({
      where: { userId },
      data: { isActive: false, updatedAt: new Date() },
    });
    return result.count;
  }

  async findActiveSession(sessionId: string): Promise<UserSession | null> {
    return this.prismaClient.session.findUnique({
      where: { id: sessionId },
    }).then((session) => {
      if (!session || !session.isActive) return null;
      return session;
    }) as Promise<UserSession | null>;
  }

  async deleteExpiredSessions(): Promise<number> {
    const result = await this.prismaClient.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }
}

/**
 * ==========================================
 * USER SETTINGS REPOSITORY
 * ==========================================
 */

export class UserSettingsRepository extends BaseRepositoryPrisma<UserSettings> implements IUserSettingsRepository {
  constructor(private prismaClient: PrismaClient) {
    const queryRepo = new BaseQueryRepositoryPrisma(prismaClient.userSetting);
    const commandRepo = new BaseCommandRepositoryPrisma(prismaClient.userSetting);
    super(queryRepo, commandRepo);
  }

  async findByUserId(userId: string): Promise<UserSettings | null> {
    return this.prismaClient.userSetting.findUnique({
      where: { userId },
    }) as Promise<UserSettings | null>;
  }

  async updateByUserId(userId: string, data: Partial<UserSettings>): Promise<UserSettings> {
    return this.prismaClient.userSetting.update({
      where: { userId },
      data,
    }) as Promise<UserSettings>;
  }
}

/**
 * Factory functions
 */

export function createUserRepository(prismaClient: PrismaClient): IUserRepository {
  return new UserRepository(prismaClient);
}

export function createSessionRepository(prismaClient: PrismaClient): ISessionRepository {
  return new SessionRepository(prismaClient);
}

export function createUserSettingsRepository(prismaClient: PrismaClient): IUserSettingsRepository {
  return new UserSettingsRepository(prismaClient);
}
