import { DefaultUserSetting } from "../../modules/system/setting/model/model";
import { defaultPartnerSettings } from "../../modules/partner-setting/model/model";
import { DEFAULT_SETTINGS } from "../../modules/admin-system-settings/model/model";

// ── User ──────────────────────────────────────────────────────────────────────

export const defaultSettings: DefaultUserSetting = {
  notifications: true,
  marketingEmails: false,
  pushNotifications: true,
  smsNotifications: false,
  shareHistory: false,
  personalizedRecs: true,
};

// ── Partner ───────────────────────────────────────────────────────────────────

export { defaultPartnerSettings as defaultPartnerSetting };

// ── System (platform) ─────────────────────────────────────────────────────────

export { DEFAULT_SETTINGS as defaultSystemSetting };
