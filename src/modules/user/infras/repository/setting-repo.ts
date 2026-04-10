import { PrismaClient } from "@prisma/client";
import { PagingDTO } from "../../../../share/model/paging";
import { IUserSettingsRepository } from "../../interface";
import { UserSettings } from "../../model/model";
import { getUserSettingModel } from "./dto";

const DEFAULT_SETTINGS: Partial<UserSettings> = {
  notifications: true,
  marketingEmails: false,
  pushNotifications: true,
  smsNotifications: false,
  autoplay: true,
  autoQuality: true,
  alwaysSubtitle: false,
  autoPreviews: true,
  publicWatchlist: false,
  shareHistory: false,
  personalizedRecs: true,
  referralCode: null,
  referrals: 0,
};

function toUserSettings(raw: any): UserSettings {
  return {
    id: raw.id,
    userId: raw.userId,
    notifications: raw.notifications ?? true,
    marketingEmails: raw.marketingEmails ?? false,
    pushNotifications: raw.pushNotifications ?? true,
    smsNotifications: raw.smsNotifications ?? false,
    autoplay: raw.autoplay ?? true,
    autoQuality: raw.autoQuality ?? true,
    alwaysSubtitle: raw.alwaysSubtitle ?? false,
    autoPreviews: raw.autoPreviews ?? true,
    publicWatchlist: raw.publicWatchlist ?? false,
    shareHistory: raw.shareHistory ?? false,
    personalizedRecs: raw.personalizedRecs ?? true,
    referralCode: raw.referralCode ?? null,
    referrals: raw.referrals ?? 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export class PrismaUserSettingsRepository implements IUserSettingsRepository {
  private readonly model: ReturnType<typeof getUserSettingModel>;

  constructor(prisma: PrismaClient) {
    this.model = getUserSettingModel(prisma);
  }

  // ── IQueryRepository ──

  async get(id: string): Promise<UserSettings | null> {
    const raw = await this.model.findUnique({ where: { id } });
    return raw ? toUserSettings(raw) : null;
  }

  /**
   * findByCond — tìm settings theo điều kiện
   * Thường dùng với { userId: "..." }
   */
  async findByCond(cond: Partial<UserSettings>): Promise<UserSettings | null> {
    const raw = await this.model.findFirst({ where: cond as any });
    return raw ? toUserSettings(raw) : null;
  }

  async list(cond: Partial<UserSettings>, paging: PagingDTO): Promise<UserSettings[]> {
    const skip = ((paging.page ?? 1) - 1) * (paging.limit ?? 20);
    const rows = await this.model.findMany({
      where: cond as any,
      skip,
      take: paging.limit ?? 20,
    });
    return rows.map(toUserSettings);
  }

  // ── ICommandRepository ──

  async insert(data: UserSettings): Promise<boolean> {
    await this.model.create({ data: data as any });
    return true;
  }

  async update(id: string, data: Partial<UserSettings>): Promise<boolean> {
    await this.model.update({ where: { id }, data: data as any });
    return true;
  }

  async delete(id: string, isHard: boolean): Promise<boolean> {
    if (isHard) {
      await this.model.delete({ where: { id } });
    } else {
      // Settings không có soft delete thực sự — reset về default
      await this.model.update({ where: { id }, data: DEFAULT_SETTINGS as any });
    }
    return true;
  }

  // ── Domain-specific ──

  async findByUserId(userId: string): Promise<UserSettings | null> {
    const raw = await this.model.findUnique({ where: { userId } });
    return raw ? toUserSettings(raw) : null;
  }

  /**
   * upsertByUserId — tạo mới nếu chưa có, cập nhật nếu đã có
   * Pattern "lazy initialization": settings chỉ được tạo khi cần
   */
  async upsertByUserId(userId: string, data: Partial<UserSettings>): Promise<UserSettings> {
    const raw = await this.model.upsert({
      where: { userId },
      update: {
        ...(data.notifications !== undefined    && { notifications: data.notifications }),
        ...(data.marketingEmails !== undefined  && { marketingEmails: data.marketingEmails }),
        ...(data.pushNotifications !== undefined && { pushNotifications: data.pushNotifications }),
        ...(data.smsNotifications !== undefined && { smsNotifications: data.smsNotifications }),
        ...(data.autoplay !== undefined         && { autoplay: data.autoplay }),
        ...(data.autoQuality !== undefined      && { autoQuality: data.autoQuality }),
        ...(data.alwaysSubtitle !== undefined   && { alwaysSubtitle: data.alwaysSubtitle }),
        ...(data.autoPreviews !== undefined     && { autoPreviews: data.autoPreviews }),
        ...(data.publicWatchlist !== undefined  && { publicWatchlist: data.publicWatchlist }),
        ...(data.shareHistory !== undefined     && { shareHistory: data.shareHistory }),
        ...(data.personalizedRecs !== undefined && { personalizedRecs: data.personalizedRecs }),
      },
      create: {
        userId,
        ...DEFAULT_SETTINGS,
        ...data,
      },
    });
    return toUserSettings(raw);
  }
}

export const createUserSettingRepository = (prisma: PrismaClient) =>
  new PrismaUserSettingsRepository(prisma);