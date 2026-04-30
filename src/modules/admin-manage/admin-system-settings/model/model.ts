export const DEFAULT_SETTINGS = {
  siteName: "CineMax",
  siteUrl: "https://cinemax.vn",
  supportEmail: "support@cinemax.vn",
  maxUploadSizeMB: "5120",
  defaultQuality: "auto",
  maintenanceMode: "false",
  registrationOpen: "true",
  ownerApprovalRequired: "true",
  maxDevicesPerUser: "4",
  sessionTimeoutHours: "720",
  timezone: "Asia/Ho_Chi_Minh",
  defaultLanguage: "vi",
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPassword: "",
  fromName: "CineMax",
  fromEmail: "noreply@cinemax.vn",
  storageProvider: "s3",
  storageBucketName: "cinemax-media-prod",
  storageRegion: "ap-southeast-1",
  storageCdnUrl: "https://cdn.cinemax.vn",
  enforceAdmin2FA: "true",
  apiRateLimitEnabled: "true",
  contentSecurityPolicyEnabled: "true",
  drmEnabled: "true",
  autoIpBlacklistEnabled: "true",
  adminIpWhitelist: "",
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
export type StringMap = Record<string, string>;
export type CanonicalMap = Record<SettingKey, string>;

export const KNOWN_KEYS = Object.keys(DEFAULT_SETTINGS) as SettingKey[];

export const GROUP_KEY_MAP = {
  system: new Set<SettingKey>([
    "siteName",
    "siteUrl",
    "supportEmail",
    "maxUploadSizeMB",
    "defaultQuality",
    "maintenanceMode",
    "registrationOpen",
    "ownerApprovalRequired",
    "maxDevicesPerUser",
    "sessionTimeoutHours",
    "timezone",
    "defaultLanguage",
  ]),
  email: new Set<SettingKey>(["smtpHost", "smtpPort", "smtpUser", "smtpPassword", "fromName", "fromEmail"]),
  storage: new Set<SettingKey>(["storageProvider", "storageBucketName", "storageRegion", "storageCdnUrl"]),
  security: new Set<SettingKey>([
    "enforceAdmin2FA",
    "apiRateLimitEnabled",
    "contentSecurityPolicyEnabled",
    "drmEnabled",
    "autoIpBlacklistEnabled",
    "adminIpWhitelist",
  ]),
} as const;

export const LEGACY_KEY_ALIAS: Record<string, SettingKey> = {
  provider: "storageProvider",
  bucketName: "storageBucketName",
  region: "storageRegion",
  cdnUrl: "storageCdnUrl",
};

export const ENUM_VALUES: Partial<Record<SettingKey, Set<string>>> = {
  defaultQuality: new Set(["auto", "480p", "720p", "1080p", "4k"]),
  defaultLanguage: new Set(["vi", "en"]),
  storageProvider: new Set(["s3", "gcs", "r2"]),
};

export const NUMBER_RANGE: Partial<Record<SettingKey, { min: number; max: number }>> = {
  maxUploadSizeMB: { min: 128, max: 102400 },
  maxDevicesPerUser: { min: 1, max: 20 },
  sessionTimeoutHours: { min: 1, max: 8760 },
  smtpPort: { min: 1, max: 65535 },
};

export const BOOLEAN_KEYS = new Set<SettingKey>([
  "maintenanceMode",
  "registrationOpen",
  "ownerApprovalRequired",
  "enforceAdmin2FA",
  "apiRateLimitEnabled",
  "contentSecurityPolicyEnabled",
  "drmEnabled",
  "autoIpBlacklistEnabled",
]);

export const URL_KEYS = new Set<SettingKey>(["siteUrl", "storageCdnUrl"]);
export const EMAIL_KEYS = new Set<SettingKey>(["supportEmail", "fromEmail"]);
export const NULLABLE_STRING_KEYS = new Set<SettingKey>(["smtpHost", "smtpUser", "smtpPassword", "adminIpWhitelist"]);

export interface QueueStats {
  waiting: number;
  active: number;
  failed: number;
}

export interface SystemStatusData {
  database: { status: "ok" | "error"; latencyMs: number };
  queues: {
    email: QueueStats;
    notification: QueueStats;
    broadcast: QueueStats;
    totalFailed: number;
  };
  process: { uptimeSeconds: number; memoryMB: number };
  maintenanceMode: boolean;
}

export interface UpdateResult {
  settings: CanonicalMap & StringMap;
  changedKeys: string[];
  previousValues: Record<string, string>;
  currentValues: Record<string, string>;
}
