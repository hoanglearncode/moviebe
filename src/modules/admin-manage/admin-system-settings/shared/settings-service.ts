import { PrismaClient } from "@prisma/client";
import { DEFAULT_SETTINGS, SettingKey } from "@/modules/admin-manage/admin-system-settings/model/model";

const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  value: string;
  expiresAt: number;
}

export class SystemSettingsService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly prisma: PrismaClient) {}

  async get(key: SettingKey): Promise<string> {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const row = await this.prisma.systemSetting.findUnique({ where: { key } });
    const value = row?.value ?? DEFAULT_SETTINGS[key];
    this.cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }

  async getBoolean(key: SettingKey): Promise<boolean> {
    const v = await this.get(key);
    return ["true", "1", "yes", "on"].includes(v.toLowerCase());
  }

  async isMaintenanceMode(): Promise<boolean> {
    return this.getBoolean("maintenanceMode");
  }

  async isRegistrationOpen(): Promise<boolean> {
    return this.getBoolean("registrationOpen");
  }

  async isOwnerApprovalRequired(): Promise<boolean> {
    return this.getBoolean("ownerApprovalRequired");
  }

  invalidate(key?: SettingKey): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

let _instance: SystemSettingsService | null = null;

export const initSystemSettingsService = (prisma: PrismaClient): SystemSettingsService => {
  _instance = new SystemSettingsService(prisma);
  return _instance;
};

export const getSystemSettingsService = (): SystemSettingsService => {
  if (!_instance) {
    throw new Error("SystemSettingsService not initialized. Call initSystemSettingsService first.");
  }
  return _instance;
};
