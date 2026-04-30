import {
  BOOLEAN_KEYS,
  CanonicalMap,
  DEFAULT_SETTINGS,
  EMAIL_KEYS,
  ENUM_VALUES,
  GROUP_KEY_MAP,
  KNOWN_KEYS,
  LEGACY_KEY_ALIAS,
  NULLABLE_STRING_KEYS,
  NUMBER_RANGE,
  SettingKey,
  StringMap,
  SystemStatusData,
  URL_KEYS,
  UpdateResult,
} from "@/modules/admin-manage/admin-system-settings/model/model";
import type { ISystemSettingsRepository, ISystemSettingsUseCase } from "@/modules/admin-manage/admin-system-settings/interface";
import { getQueueHealth } from "@/queue/health";
import { ValidationError } from "@/share/transport/http-server";

function normalizeBoolean(value: unknown): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return value === 1 ? "true" : value === 0 ? "false" : "";
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(v)) return "true";
    if (["false", "0", "no", "off"].includes(v)) return "false";
  }
  return "";
}

export function canonicalKey(raw: string): SettingKey | null {
  if ((KNOWN_KEYS as string[]).includes(raw)) return raw as SettingKey;
  return LEGACY_KEY_ALIAS[raw] ?? null;
}

export function sanitizeByKey(key: SettingKey, value: unknown): string {
  if (value === undefined || value === null) {
    throw new Error(`'${key}' cannot be null or undefined`);
  }

  if (BOOLEAN_KEYS.has(key)) {
    const parsed = normalizeBoolean(value);
    if (!parsed) throw new Error(`'${key}' must be a boolean`);
    return parsed;
  }

  if (NUMBER_RANGE[key]) {
    const num = Number(value);
    if (!Number.isFinite(num)) throw new Error(`'${key}' must be a number`);
    const intVal = Math.floor(num);
    const { min, max } = NUMBER_RANGE[key]!;
    if (intVal < min || intVal > max) {
      throw new Error(`'${key}' must be in range ${min}-${max}`);
    }
    return String(intVal);
  }

  const stringValue = String(value).trim();
  if (!stringValue) {
    if (NULLABLE_STRING_KEYS.has(key)) return "";
    throw new Error(`'${key}' cannot be empty`);
  }

  if (ENUM_VALUES[key] && !ENUM_VALUES[key]!.has(stringValue)) {
    throw new Error(`'${key}' has invalid value`);
  }

  if (URL_KEYS.has(key)) {
    try {
      const u = new URL(stringValue);
      if (!["http:", "https:"].includes(u.protocol)) throw new Error("invalid protocol");
    } catch {
      throw new Error(`'${key}' must be a valid http(s) URL`);
    }
  }

  if (EMAIL_KEYS.has(key)) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(stringValue)) {
      throw new Error(`'${key}' must be a valid email`);
    }
  }

  return stringValue;
}

function flattenIncomingPayload(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {};
  const source = body as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    const group = key as keyof typeof GROUP_KEY_MAP;
    if (GROUP_KEY_MAP[group] && value && typeof value === "object" && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
        result[nestedKey] = nestedValue;
      }
      continue;
    }
    result[key] = value;
  }
  return result;
}

function normalizeSettings(raw: Record<string, string>): CanonicalMap {
  const result = { ...DEFAULT_SETTINGS } as CanonicalMap;
  for (const key of KNOWN_KEYS) {
    try {
      const source = raw[key] ?? DEFAULT_SETTINGS[key];
      result[key] = sanitizeByKey(key, source);
    } catch {
      result[key] = DEFAULT_SETTINGS[key];
    }
  }
  return result;
}

function buildFlatResponse(settings: CanonicalMap): CanonicalMap & StringMap {
  return {
    ...settings,
    provider: settings.storageProvider,
    bucketName: settings.storageBucketName,
    region: settings.storageRegion,
    cdnUrl: settings.storageCdnUrl,
  };
}

export class SystemSettingsUseCase implements ISystemSettingsUseCase {
  constructor(private readonly repo: ISystemSettingsRepository) {}

  async getSettings(): Promise<CanonicalMap & StringMap> {
    const raw = await this.repo.findAll();
    const normalized = normalizeSettings(raw);
    return buildFlatResponse(normalized);
  }

  async updateSettings(body: unknown): Promise<UpdateResult> {
    const flattened = flattenIncomingPayload(body);

    if (Object.keys(flattened).length === 0) {
      throw new ValidationError("Request body must be an object of key-value pairs");
    }

    const updates: Partial<CanonicalMap> = {};
    const unknownKeys: string[] = [];
    const validationErrors: string[] = [];

    for (const [rawKey, rawValue] of Object.entries(flattened)) {
      const key = canonicalKey(rawKey);
      if (!key) {
        unknownKeys.push(rawKey);
        continue;
      }
      try {
        updates[key] = sanitizeByKey(key, rawValue);
      } catch (error: any) {
        validationErrors.push(error.message || `Invalid value for '${rawKey}'`);
      }
    }

    if (unknownKeys.length > 0) {
      throw new ValidationError(`Unknown settings key(s): ${unknownKeys.join(", ")}`);
    }

    if (validationErrors.length > 0) {
      throw new ValidationError("Validation failed", validationErrors);
    }

    const currentRaw = await this.repo.findAll();
    const current = normalizeSettings(currentRaw);

    const changedEntries = Object.entries(updates).filter(([k, v]) => current[k as SettingKey] !== v);

    if (changedEntries.length > 0) {
      await this.repo.upsertMany(
        changedEntries.map(([key, value]) => ({ key, value: String(value) })),
      );
    }

    const updatedRaw = await this.repo.findAll();
    const updatedSettings = normalizeSettings(updatedRaw);

    const changedKeys = changedEntries.map(([key]) => key);
    const previousValues = changedKeys.reduce<Record<string, string>>((acc, key) => {
      acc[key] = current[key as SettingKey];
      return acc;
    }, {});
    const currentValues = changedKeys.reduce<Record<string, string>>((acc, key) => {
      acc[key] = updatedSettings[key as SettingKey];
      return acc;
    }, {});

    return {
      settings: buildFlatResponse(updatedSettings),
      changedKeys,
      previousValues,
      currentValues,
    };
  }

  async getSystemStatus(): Promise<SystemStatusData> {
    const [dbResult, queueHealth] = await Promise.allSettled([
      this.repo.pingDatabase(),
      getQueueHealth(),
    ]);

    const database =
      dbResult.status === "fulfilled"
        ? dbResult.value
        : { status: "error" as const, latencyMs: -1 };

    const queues =
      queueHealth.status === "fulfilled"
        ? queueHealth.value
        : {
            email: { waiting: 0, active: 0, failed: 0 },
            notification: { waiting: 0, active: 0, failed: 0 },
            broadcast: { waiting: 0, active: 0, failed: 0 },
            totalFailed: 0,
          };

    const raw = await this.repo.findAll().catch(() => ({} as Record<string, string>));
    const maintenanceMode = (raw["maintenanceMode"] ?? "false") === "true";

    const memUsage = process.memoryUsage();

    return {
      database,
      queues,
      process: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      },
      maintenanceMode,
    };
  }
}
