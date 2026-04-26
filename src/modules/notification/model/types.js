"use strict";
// ─ Email Notification Event Types ───────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailNotificationEventType = void 0;
var EmailNotificationEventType;
(function (EmailNotificationEventType) {
    EmailNotificationEventType["VERIFY_EMAIL"] = "VERIFY_EMAIL";
    EmailNotificationEventType["RESET_PASSWORD"] = "RESET_PASSWORD";
    EmailNotificationEventType["WELCOME_NEW_ACCOUNT"] = "WELCOME_NEW_ACCOUNT";
    EmailNotificationEventType["WELCOME_SOCIAL_LOGIN"] = "WELCOME_SOCIAL_LOGIN";
    EmailNotificationEventType["ACCOUNT_UPDATED_BY_ADMIN"] = "ACCOUNT_UPDATED_BY_ADMIN";
    EmailNotificationEventType["PASSWORD_CHANGED"] = "PASSWORD_CHANGED";
    EmailNotificationEventType["ACCOUNT_DELETED"] = "ACCOUNT_DELETED";
    EmailNotificationEventType["LOGIN_WARNING"] = "LOGIN_WARNING";
    EmailNotificationEventType["PROMO_CAMPAIGN"] = "PROMO_CAMPAIGN";
})(EmailNotificationEventType || (exports.EmailNotificationEventType = EmailNotificationEventType = {}));
