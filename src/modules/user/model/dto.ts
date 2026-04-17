import { z } from "zod";
import { isPermissionCode } from "../../../share/security/permissions";

// ── UPDATE PROFILE ─────────────────────────────────────────────────────────────

export const UpdateProfilePayloadSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{9,}$/, "invalid phone number format")
    .optional(),
  avatar: z.string().trim().url("avatar must be a valid URL").optional(),
  bio: z.string().trim().max(500).optional(),
  location: z.string().trim().max(255).optional(),
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfilePayloadSchema>;
export const UpdateProfilePayloadDTO = UpdateProfilePayloadSchema;

// ── CHANGE PASSWORD ────────────────────────────────────────────────────────────

export const ChangePasswordPayloadSchema = z
  .object({
    currentPassword: z.string().min(1, "current password is required"),
    newPassword: z.string().min(8, "new password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "confirm password is required"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "new password must be different from current password",
    path: ["newPassword"],
  });

export type ChangePasswordDTO = z.infer<typeof ChangePasswordPayloadSchema>;
export const ChangePasswordPayloadDTO = ChangePasswordPayloadSchema;

// ── SESSION MANAGEMENT ─────────────────────────────────────────────────────────

export const RevokeSessionPayloadSchema = z.object({
  sessionId: z.string().trim().min(1, "sessionId is required"),
});

export type RevokeSessionDTO = z.infer<typeof RevokeSessionPayloadSchema>;
export const RevokeSessionPayloadDTO = RevokeSessionPayloadSchema;

export const GetSessionsQueryPayloadSchema = z.object({
  // ✅ coerce: query string "10" → number 10
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  orderBy: z.enum(["createdAt", "lastActivityAt"]).optional(),
});

export type GetSessionsQueryDTO = z.infer<typeof GetSessionsQueryPayloadSchema>;
export const GetSessionsQueryPayloadDTO = GetSessionsQueryPayloadSchema;

// ── USER SETTINGS ──────────────────────────────────────────────────────────────

export const UpdateSettingsPayloadSchema = z.object({
  notifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  shareHistory: z.boolean().optional(),
  personalizedRecs: z.boolean().optional(),
});

export type UpdateSettingsDTO = z.infer<typeof UpdateSettingsPayloadSchema>;
export const UpdateSettingsPayloadDTO = UpdateSettingsPayloadSchema;

// ── ADMIN USER MANAGEMENT ──────────────────────────────────────────────────────

export const CreateUserPayloadSchema = z.object({
  email: z.string().trim().toLowerCase().email("invalid email address"),
  name: z.string().trim().min(1).nullable().optional(),
  username: z.string().trim().min(3).max(50).optional(),
  password: z.string().min(8, "password must be at least 8 characters"),
  avatar: z.string().trim().nullable().optional(),
  emailVerified: z.boolean().default(false).optional(),
  sendEmailWellCome: z.boolean().default(true).optional(),
  phone: z.string().trim().optional(),
  location: z.string().trim().optional(),
  role: z.enum(["USER", "ADMIN", "PARTNER"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BANNED", "PENDING"]).optional(),
  permissionsOverride: z
    .array(z.string().trim().min(1))
    .optional()
    .refine((permissions) => !permissions || permissions.every(isPermissionCode), {
      message: "invalid permission code",
    }),
});

export type CreateUserDTO = z.infer<typeof CreateUserPayloadSchema>;
export const CreateUserPayloadDTO = CreateUserPayloadSchema;

export const UpdateUserPayloadSchema = z.object({
  email: z.string().trim().toLowerCase().email("invalid email address").optional(),
  name: z.string().trim().min(1).optional(),
  username: z.string().trim().min(3).max(50).optional(),
  phone: z.string().trim().optional(),
  avatar: z.string().trim().url("avatar must be a valid URL").optional(),
  bio: z.string().trim().max(500).optional(),
  role: z.enum(["USER", "ADMIN", "PARTNER"]).optional(),
  permissionsOverride: z
    .array(z.string().trim().min(1))
    .optional()
    .refine((permissions) => !permissions || permissions.every(isPermissionCode), {
      message: "invalid permission code",
    }),
});

export type UpdateUserDTO = z.infer<typeof UpdateUserPayloadSchema>;
export const UpdateUserPayloadDTO = UpdateUserPayloadSchema;

export const ChangeUserStatusPayloadSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "BANNED", "PENDING"]).optional(),
  reason: z.string().trim().optional(),
});

export type ChangeUserStatusDTO = z.infer<typeof ChangeUserStatusPayloadSchema>;
export const ChangeUserStatusPayloadDTO = ChangeUserStatusPayloadSchema;

export const ResetUserPasswordPayloadSchema = z.object({
  tempPassword: z.string().min(8).optional(),
  sendEmail: z.boolean().default(true),
});

export type ResetUserPasswordDTO = z.infer<typeof ResetUserPasswordPayloadSchema>;
export const ResetUserPasswordPayloadDTO = ResetUserPasswordPayloadSchema;

export const ListUsersQueryPayloadSchema = z.object({
  // ✅ coerce: "1" → 1, "20" → 20
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  keyword: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email("invalid email address").optional(),
  username: z.string().trim().optional(),
  role: z.enum(["USER", "ADMIN", "PARTNER"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BANNED", "PENDING"]).optional(),
  sortBy: z.enum(["createdAt", "name", "email", "lastLoginAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListUsersQueryDTO = z.infer<typeof ListUsersQueryPayloadSchema>;
export const ListUsersQueryPayloadDTO = ListUsersQueryPayloadSchema;

// ── SEED DATA ──────────────────────────────────────────────────────────────────

export const SeedUsersPayloadSchema = z.object({
  // ✅ coerce: nếu gọi qua form/query thay vì JSON body
  count: z.coerce.number().int().min(1).max(100000),
  batchSize: z.coerce.number().int().min(10).max(1000).optional().default(100),
  // ✅ coerce: "true"/"false" string → boolean (an toàn cho cả JSON body lẫn query)
  includePhone: z.coerce.boolean().optional().default(true),
  includeBio: z.coerce.boolean().optional().default(true),
  includeLocation: z.coerce.boolean().optional().default(true),
  defaultRole: z.enum(["USER", "ADMIN", "PARTNER"]).optional().default("USER"),
  defaultStatus: z.enum(["ACTIVE", "INACTIVE", "BANNED", "PENDING"]).optional().default("ACTIVE"),
});

export type SeedUsersDTO = z.infer<typeof SeedUsersPayloadSchema>;
export const SeedUsersPayloadDTO = SeedUsersPayloadSchema;

// ── LEGACY EXPORTS ─────────────────────────────────────────────────────────────

export const UserCreate = CreateUserPayloadSchema;
export const UserUpdate = UpdateUserPayloadSchema;
export const UserCond = ListUsersQueryPayloadSchema;
export const UserBan = z.object({
  userId: z.string().trim().min(1, "userId is required"),
});

export type UserCreateDTO = z.infer<typeof UserCreate>;
export type UserUpdateDTO = z.infer<typeof UserUpdate>;
export type UserCondDTO = z.infer<typeof UserCond>;
export type UserBanDTO = z.infer<typeof UserBan>;
