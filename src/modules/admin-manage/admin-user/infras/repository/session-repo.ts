import { PrismaClient } from "@prisma/client";
import { PagingDTO } from "../../../../share/model/paging";
import { ISessionRepository } from "@/modules/admin-manage/admin-user/interface";
import { UserSession } from "@/modules/admin-manage/admin-user/model/model";
import { getSessionModel } from "@/modules/admin-manage/admin-user/infras/repository/dto";

function toUserSession(raw: any): UserSession {
  return {
    id: raw.id,
    userId: raw.userId,
    refreshToken: raw.refreshToken,
    deviceId: raw.deviceId ?? null,
    deviceName: raw.deviceName ?? null,
    deviceType: raw.deviceType ?? null,
    ipAddress: raw.ipAddress ?? null,
    userAgent: raw.userAgent ?? null,
    isActive: raw.isActive ?? true,
    expiresAt: raw.expiresAt,
    lastActivityAt: raw.lastActivityAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export class PrismaSessionRepository implements ISessionRepository {
  private readonly model: ReturnType<typeof getSessionModel>;

  constructor(prisma: PrismaClient) {
    this.model = getSessionModel(prisma);
  }

  // ── IQueryRepository ──

  async get(id: string): Promise<UserSession | null> {
    return this.findById(id);
  }

  async findByCond(cond: Partial<UserSession>): Promise<UserSession | null> {
    const raw = await this.model.findFirst({ where: cond as any });
    return raw ? toUserSession(raw) : null;
  }

  async list(cond: Partial<UserSession>, paging: PagingDTO): Promise<UserSession[]> {
    const skip = ((paging.page ?? 1) - 1) * (paging.limit ?? 20);
    const rows = await this.model.findMany({
      where: cond as any,
      skip,
      take: paging.limit ?? 20,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toUserSession);
  }

  // ── ICommandRepository ──

  async insert(data: UserSession): Promise<boolean> {
    await this.model.create({ data: data as any });
    return true;
  }

  async update(id: string, data: Partial<UserSession>): Promise<boolean> {
    await this.model.update({ where: { id }, data: data as any });
    return true;
  }

  /**
   * delete — isHard=true xoá hẳn, isHard=false deactivate
   */
  async delete(id: string, isHard: boolean): Promise<boolean> {
    if (isHard) {
      await this.model.delete({ where: { id } });
    } else {
      await this.model.update({ where: { id }, data: { isActive: false } });
    }
    return true;
  }

  // ── Domain-specific ──

  async findById(sessionId: string): Promise<UserSession | null> {
    const raw = await this.model.findUnique({ where: { id: sessionId } });
    return raw ? toUserSession(raw) : null;
  }

  async findByUserId(userId: string): Promise<UserSession[]> {
    const rows = await this.model.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActivityAt: "desc" },
    });
    return rows.map(toUserSession);
  }

  async findActiveSession(sessionId: string): Promise<UserSession | null> {
    const raw = await this.model.findFirst({
      where: { id: sessionId, isActive: true, expiresAt: { gt: new Date() } },
    });
    return raw ? toUserSession(raw) : null;
  }

  async revokeSession(sessionId: string): Promise<boolean> {
    await this.model.update({ where: { id: sessionId }, data: { isActive: false } });
    return true;
  }

  async revokeAllSessionsByUserId(userId: string): Promise<number> {
    const result = await this.model.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
    return result.count;
  }

  async deleteExpiredSessions(): Promise<number> {
    const result = await this.model.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}

export const createSessionRepository = (prisma: PrismaClient) =>
  new PrismaSessionRepository(prisma);
