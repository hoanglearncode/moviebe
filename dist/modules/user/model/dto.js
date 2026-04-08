"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBan = exports.UserCond = exports.UserUpdate = exports.UserCreate = exports.ListUsersQueryPayloadDTO = exports.ResetUserPasswordPayloadDTO = exports.ChangeUserStatusPayloadDTO = exports.UpdateUserPayloadDTO = exports.CreateUserPayloadDTO = exports.UpdateSettingsPayloadDTO = exports.GetSessionsQueryPayloadDTO = exports.RevokeSessionPayloadDTO = exports.ChangePasswordPayloadDTO = exports.UpdateProfilePayloadDTO = void 0;
const zod_1 = __importDefault(require("zod"));
/**
 * ==========================================
 * USER PROFILE DTOs
 * ==========================================
 */
exports.UpdateProfilePayloadDTO = zod_1.default.object({
    name: zod_1.default.string().trim().min(1, "name is required").max(255).optional(),
    phone: zod_1.default.string().trim().regex(/^\+?[0-9\s\-()]{9,}$/, "invalid phone").optional(),
    avatar: zod_1.default.string().trim().url("invalid avatar url").optional(),
    bio: zod_1.default.string().trim().max(500, "bio max 500 characters").optional(),
    location: zod_1.default.string().trim().max(255).optional(),
});
exports.ChangePasswordPayloadDTO = zod_1.default.object({
    currentPassword: zod_1.default.string().min(1, "current password is required"),
    newPassword: zod_1.default.string().min(8, "new password must be at least 8 characters"),
    confirmPassword: zod_1.default.string().min(8, "confirm password required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "passwords do not match",
    path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
    message: "new password must be different from current password",
    path: ["newPassword"],
});
/**
 * ==========================================
 * SESSION DTOs
 * ==========================================
 */
exports.RevokeSessionPayloadDTO = zod_1.default.object({
    sessionId: zod_1.default.string().min(1, "session id is required"),
});
exports.GetSessionsQueryPayloadDTO = zod_1.default.object({
    limit: zod_1.default.number().int().min(1).max(100).optional(),
    offset: zod_1.default.number().int().min(0).optional(),
    orderBy: zod_1.default.enum(["createdAt", "lastActivityAt"]).optional(),
});
/**
 * ==========================================
 * SETTINGS DTOs
 * ==========================================
 */
exports.UpdateSettingsPayloadDTO = zod_1.default.object({
    notifications: zod_1.default.boolean().optional(),
    marketingEmails: zod_1.default.boolean().optional(),
    pushNotifications: zod_1.default.boolean().optional(),
    smsNotifications: zod_1.default.boolean().optional(),
    autoplay: zod_1.default.boolean().optional(),
    autoQuality: zod_1.default.boolean().optional(),
    alwaysSubtitle: zod_1.default.boolean().optional(),
    autoPreviews: zod_1.default.boolean().optional(),
    publicWatchlist: zod_1.default.boolean().optional(),
    shareHistory: zod_1.default.boolean().optional(),
    personalizedRecs: zod_1.default.boolean().optional(),
});
/**
 * ==========================================
 * ADMIN USER MANAGEMENT DTOs
 * ==========================================
 */
exports.CreateUserPayloadDTO = zod_1.default.object({
    email: zod_1.default.string().trim().toLowerCase().email("invalid email"),
    name: zod_1.default.string().trim().min(1, "name is required").optional(),
    username: zod_1.default.string().trim().min(3).max(50).optional(),
    password: zod_1.default.string().min(8, "password must be at least 8 characters"),
    role: zod_1.default.enum(["USER", "ADMIN", "PARTNER"]).optional(),
    status: zod_1.default.enum(["ACTIVE", "INACTIVE", "BANNED", "PENDING"]).optional(),
});
exports.UpdateUserPayloadDTO = zod_1.default.object({
    email: zod_1.default.string().trim().toLowerCase().email("invalid email").optional(),
    name: zod_1.default.string().trim().min(1).optional(),
    username: zod_1.default.string().trim().min(3).max(50).optional(),
    phone: zod_1.default.string().trim().optional(),
    avatar: zod_1.default.string().trim().url().optional(),
    bio: zod_1.default.string().trim().max(500).optional(),
    role: zod_1.default.enum(["USER", "ADMIN", "PARTNER"]).optional(),
});
exports.ChangeUserStatusPayloadDTO = zod_1.default.object({
    status: zod_1.default.enum(["ACTIVE", "INACTIVE", "BANNED", "PENDING"]).optional(),
    reason: zod_1.default.string().trim().optional(),
});
exports.ResetUserPasswordPayloadDTO = zod_1.default.object({
    tempPassword: zod_1.default.string().min(8, "temporary password is required").optional(),
    sendEmail: zod_1.default.boolean().default(true),
});
exports.ListUsersQueryPayloadDTO = zod_1.default.object({
    page: zod_1.default.number().int().min(1).default(1),
    limit: zod_1.default.number().int().min(1).max(100).default(20),
    keyword: zod_1.default.string().trim().optional(), // search by email, username, name
    email: zod_1.default.string().trim().toLowerCase().email().optional(),
    username: zod_1.default.string().trim().optional(),
    role: zod_1.default.enum(["USER", "ADMIN", "PARTNER"]).optional(),
    status: zod_1.default.enum(["ACTIVE", "INACTIVE", "BANNED", "PENDING"]).optional(),
    sortBy: zod_1.default.enum(["createdAt", "name", "email"]).default("createdAt"),
    sortOrder: zod_1.default.enum(["asc", "desc"]).default("desc"),
});
// Legacy DTOs (kept for backward compatibility)
exports.UserCreate = exports.CreateUserPayloadDTO;
exports.UserUpdate = exports.UpdateUserPayloadDTO;
exports.UserCond = exports.ListUsersQueryPayloadDTO;
exports.UserBan = zod_1.default.object({
    userId: zod_1.default.string(),
});
