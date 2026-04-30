import { PrismaClient } from "@prisma/client";
import { DEFAULT_SETTINGS } from "@/modules/admin-manage/admin-system-settings/model/model";
import type { ISystemSettingsRepository } from "@/modules/admin-manage/admin-system-settings/interface";

export class SystemSettingsRepository implements ISystemSettingsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Record<string, string>> {
    const rows = await this.prisma.systemSetting.findMany();
    const result: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const row of rows) result[row.key] = row.value;
    return result;
  }

  async upsertMany(entries: Array<{ key: string; value: string }>): Promise<void> {
    await this.prisma.$transaction(
      entries.map(({ key, value }) =>
        this.prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    );
  }

  async pingDatabase(): Promise<{ status: "ok" | "error"; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", latencyMs: Date.now() - start };
    } catch {
      return { status: "error", latencyMs: Date.now() - start };
    }
  }
}
