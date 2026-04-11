"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBan = exports.UserCond = exports.UserUpdate = exports.UserCreate = exports.SeedUsersPayloadDTO = exports.SeedUsersPayloadSchema = exports.ListUsersQueryPayloadDTO = exports.ListUsersQueryPayloadSchema = exports.ResetUserPasswordPayloadDTO = exports.ResetUserPasswordPayloadSchema = exports.ChangeUserStatusPayloadDTO = exports.ChangeUserStatusPayloadSchema = exports.UpdateUserPayloadDTO = exports.UpdateUserPayloadSchema = exports.CreateUserPayloadDTO = exports.CreateUserPayloadSchema = exports.UpdateSettingsPayloadDTO = exports.UpdateSettingsPayloadSchema = exports.GetSessionsQueryPayloadDTO = exports.GetSessionsQueryPayloadSchema = exports.RevokeSessionPayloadDTO = exports.RevokeSessionPayloadSchema = exports.ChangePasswordPayloadDTO = exports.ChangePasswordPayloadSchema = exports.UpdateProfilePayloadDTO = exports.UpdateProfilePayloadSchema = void 0;
const zod_1 = require("zod");
// ── UPDATE PROFILE ─────────────────────────────────────────────────────────────
exports.UpdateProfilePayloadSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(255).optional(),
    phone: zod_1.z.string().trim().regex(/^\+?[0-9\s\-()]{9,}$/, "invalid phone number format").optional(),
    avatar: zod_1.z.string().trim().url("avatar must be a valid URL").optional(),
    bio: zod_1.z.string().trim().max(500).optional(),
    location: zod_1.z.string().trim().max(255).optional(),
});
exports.UpdateProfilePayloadDTO = exports.UpdateProfilePayloadSchema;
// ── CHANGE PASSWORD ────────────────────────────────────────────────────────────
exports.ChangePasswordPayloadSchema = zod_1.z
    .object({
    currentPassword: zod_1.z.string().min(1, "current password is required"),
    newPassword: zod_1.z.string().min(8, "new password must be at least 8 characters"),
    confirmPassword: zod_1.z.string().min(8, "confirm password is required"),
})
    .refine(d => d.newPassword === d.confirmPassword, {
    message: "passwords do not match",
    path: ["confirmPassword"],
})
    .refine(d => d.currentPassword !== d.newPassword, {
    message: "new password must be different from current password",
    path: ["newPassword"],
});
exports.ChangePasswordPayloadDTO = exports.ChangePasswordPayloadSchema;
// ── SESSION MANAGEMENT ─────────────────────────────────────────────────────────
exports.RevokeSessionPayloadSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid("session id must be a valid UUID"),
});
exports.RevokeSessionPayloadDTO = exports.RevokeSessionPayloadSchema;
exports.GetSessionsQueryPayloadSchema = zod_1.z.object({
    // ✅ coerce: query string "10" → number 10
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    offset: zod_1.z.coerce.number().int().min(0).optional(),
    orderBy: zod_1.z.enum(["createdAt", "lastActivityAt"]).optional(),
});
exports.GetSessionsQueryPayloadDTO = exports.GetSessionsQueryPayloadSchema;
// ── USER SETTINGS ──────────────────────────────────────────────────────────────
exports.UpdateSettingsPayloadSchema = zod_1.z.object({
    notifications: zod_1.z.boolean().optional(),
    marketingEmails: zod_1.z.boolean().optional(),
    pushNotifications: zod_1.z.boolean().optional(),
    smsNotifications: zod_1.z.boolean().optional(),
    autoplay: zod_1.z.boolean().optional(),
    autoQuality: zod_1.z.boolean().optional(),
    alwaysSubtitle: zod_1.z.boolean().optional(),
    autoPreviews: zod_1.z.boolean().optional(),
    publicWatchlist: zod_1.z.boolean().optional(),
    shareHistory: zod_1.z.boolean().optional(),
    personalizedRecs: zod_1.z.boolean().optional(),
});
exports.UpdateSettingsPayloadDTO = exports.UpdateSettingsPayloadSchema;
// ── ADMIN USER MANAGEMENT ──────────────────────────────────────────────────────
exports.CreateUserPayloadSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email("invalid email address"),
    name: zod_1.z.string().trim().min(1).nullable().optional(),
    username: zod_1.z.string().trim().min(3).max(50).optional(),
    password: zod_1.z.string().min(8, "password must be at least 8 characters"),
    avatar: zod_1.z.string().trim().nullable().optional(),
    emailVerified: zod_1.z.boolean().default(false).optional(),
    phone: zod_1.z.string().trim().optional(),
    location: zod_1.z.string().trim().optional(),
    role: zod_1.z.enum(["USER", "ADMIN", "PARTNER"]).optional(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE", "BANNED", "PENDING"]).optional(),
});
exports.CreateUserPayloadDTO = exports.CreateUserPayloadSchema;
exports.UpdateUserPayloadSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email("invalid email address").optional(),
    name: zod_1.z.string().trim().min(1).optional(),
    username: zod_1.z.string().trim().min(3).max(50).optional(),
    phone: zod_1.z.string().trim().optional(),
    avatar: zod_1.z.string().trim().url("avatar must be a valid URL").optional(),
    bio: zod_1.z.string().trim().max(500).optional(),
    role: zod_1.z.enum(["USER", "ADMIN", "PARTNER"]).optional(),
});
exports.UpdateUserPayloadDTO = exports.UpdateUserPayloadSchema;
exports.ChangeUserStatusPayloadSchema = zod_1.z.object({
    status: zod_1.z.enum(["ACTIVE", "INACTIVE", "BANNED", "PENDING"]).optional(),
    reason: zod_1.z.string().trim().optional(),
});
exports.ChangeUserStatusPayloadDTO = exports.ChangeUserStatusPayloadSchema;
exports.ResetUserPasswordPayloadSchema = zod_1.z.object({
    tempPassword: zod_1.z.string().min(8).optional(),
    sendEmail: zod_1.z.boolean().default(true),
});
exports.ResetUserPasswordPayloadDTO = exports.ResetUserPasswordPayloadSchema;
exports.ListUsersQueryPayloadSchema = zod_1.z.object({
    // ✅ coerce: "1" → 1, "20" → 20
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    keyword: zod_1.z.string().trim().optional(),
    email: zod_1.z.string().trim().toLowerCase().email("invalid email address").optional(),
    username: zod_1.z.string().trim().optional(),
    role: zod_1.z.enum(["USER", "ADMIN", "PARTNER"]).optional(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE", "BANNED", "PENDING"]).optional(),
    sortBy: zod_1.z.enum(["createdAt", "name", "email", "lastLoginAt"]).default("createdAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).default("desc"),
});
exports.ListUsersQueryPayloadDTO = exports.ListUsersQueryPayloadSchema;
// ── SEED DATA ──────────────────────────────────────────────────────────────────
exports.SeedUsersPayloadSchema = zod_1.z.object({
    // ✅ coerce: nếu gọi qua form/query thay vì JSON body
    count: zod_1.z.coerce.number().int().min(1).max(100000),
    batchSize: zod_1.z.coerce.number().int().min(10).max(1000).optional().default(100),
    // ✅ coerce: "true"/"false" string → boolean (an toàn cho cả JSON body lẫn query)
    includePhone: zod_1.z.coerce.boolean().optional().default(true),
    includeBio: zod_1.z.coerce.boolean().optional().default(true),
    includeLocation: zod_1.z.coerce.boolean().optional().default(true),
    defaultRole: zod_1.z.enum(["USER", "ADMIN", "PARTNER"]).optional().default("USER"),
    defaultStatus: zod_1.z.enum(["ACTIVE", "INACTIVE", "BANNED", "PENDING"]).optional().default("ACTIVE"),
});
exports.SeedUsersPayloadDTO = exports.SeedUsersPayloadSchema;
// ── LEGACY EXPORTS ─────────────────────────────────────────────────────────────
exports.UserCreate = exports.CreateUserPayloadSchema;
exports.UserUpdate = exports.UpdateUserPayloadSchema;
exports.UserCond = exports.ListUsersQueryPayloadSchema;
exports.UserBan = zod_1.z.object({
    userId: zod_1.z.string().uuid("userId must be a valid UUID"),
});
