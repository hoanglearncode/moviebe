import type {
  CanonicalMap,
  StringMap,
  SystemStatusData,
  UpdateResult,
} from "@/modules/admin-manage/admin-system-settings/model/model";

export interface ISystemSettingsRepository {
  findAll(): Promise<Record<string, string>>;
  upsertMany(entries: Array<{ key: string; value: string }>): Promise<void>;
  pingDatabase(): Promise<{ status: "ok" | "error"; latencyMs: number }>;
}

export interface ISystemSettingsUseCase {
  getSettings(): Promise<CanonicalMap & StringMap>;
  updateSettings(body: unknown): Promise<UpdateResult>;
  getSystemStatus(): Promise<SystemStatusData>;
}
