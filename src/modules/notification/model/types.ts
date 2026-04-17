// ─ Email Notification Event Types ───────────────────────────────────────

export enum EmailNotificationEventType {
  VERIFY_EMAIL = "VERIFY_EMAIL",
  RESET_PASSWORD = "RESET_PASSWORD",
  WELCOME_NEW_ACCOUNT = "WELCOME_NEW_ACCOUNT",
  WELCOME_SOCIAL_LOGIN = "WELCOME_SOCIAL_LOGIN",
  ACCOUNT_UPDATED_BY_ADMIN = "ACCOUNT_UPDATED_BY_ADMIN",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  ACCOUNT_DELETED = "ACCOUNT_DELETED",
  LOGIN_WARNING = "LOGIN_WARNING",
  PROMO_CAMPAIGN = "PROMO_CAMPAIGN",
}

export interface EmailNotificationPayload {
  userId?: string;
  email: string;
  name?: string;
  [key: string]: any; // Dynamic variables for template substitution
}

export interface WelcomeEmailPayload extends EmailNotificationPayload {
  email: string;
  name?: string;
}

export interface AccountUpdatedEmailPayload extends EmailNotificationPayload {
  email: string;
  name?: string;
  changes?: string; // What was changed
}

export interface PasswordChangeEmailPayload extends EmailNotificationPayload {
  email: string;
  name?: string;
}
