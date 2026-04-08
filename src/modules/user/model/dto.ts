import z from "zod";

/**
 * ==========================================
 * USER PROFILE DTOs
 * ==========================================
 */

export const UpdateProfilePayloadDTO = z.object({
  name: z.string().trim().min(1, "name is required").max(255).optional(),
  phone: z.string().trim().regex(/^\+?[0-9\s\-()]{9,}$/, "invalid phone").optional(),
  avatar: z.string().trim().url("invalid avatar url").optional(),
  bio: z.string().trim().max(500, "bio max 500 characters").optional(),
  location: z.string().trim().max(255).optional(),
});

export const ChangePasswordPayloadDTO = z.object({
  currentPassword: z.string().min(1, "current password is required"),
  newPassword: z.string().min(8, "new password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "confirm password required"),
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

export const RevokeSessionPayloadDTO = z.object({
  sessionId: z.string().min(1, "session id is required"),
});

export const GetSessionsQueryPayloadDTO = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  orderBy: z.enum(["createdAt", "lastActivityAt"]).optional(),
});

/**
 * ==========================================
 * SETTINGS DTOs
 * ==========================================
 */

export const UpdateSettingsPayloadDTO = z.object({
  notifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  autoplay: z.boolean().optional(),
  autoQuality: z.boolean().optional(),
  alwaysSubtitle: z.boolean().optional(),
  autoPreviews: z.boolean().optional(),
  publicWatchlist: z.boolean().optional(),
  shareHistory: z.boolean().optional(),
  personalizedRecs: z.boolean().optional(),
});

/**
 * ==========================================
 * ADMIN USER MANAGEMENT DTOs
 * ==========================================
 */

export const CreateUserPayloadDTO = z.object({
  email: z.string().trim().toLowerCase().email("invalid email"),
  name: z.string().trim().min(1, "name is required").optional(),
  username: z.string().trim().min(3).max(50).optional(),
  password: z.string().min(8, "password must be at least 8 characters"),
  role: z.enum(["USER", "ADMIN", "PARTNER"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BANNED", "PENDING"]).optional(),
});

export const UpdateUserPayloadDTO = z.object({
  email: z.string().trim().toLowerCase().email("invalid email").optional(),
  name: z.string().trim().min(1).optional(),
  username: z.string().trim().min(3).max(50).optional(),
  phone: z.string().trim().optional(),
  avatar: z.string().trim().url().optional(),
  bio: z.string().trim().max(500).optional(),
  role: z.enum(["USER", "ADMIN", "PARTNER"]).optional(),
});

export const ChangeUserStatusPayloadDTO = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "BANNED", "PENDING"]).optional(),
  reason: z.string().trim().optional(),
});

export const ResetUserPasswordPayloadDTO = z.object({
  tempPassword: z.string().min(8, "temporary password is required").optional(),
  sendEmail: z.boolean().default(true),
});

export const ListUsersQueryPayloadDTO = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  keyword: z.string().trim().optional(), // search by email, username, name
  email: z.string().trim().toLowerCase().email().optional(),
  username: z.string().trim().optional(),
  role: z.enum(["USER", "ADMIN", "PARTNER"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BANNED", "PENDING"]).optional(),
  sortBy: z.enum(["createdAt", "name", "email"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * ==========================================
 * TYPE EXPORTS
 * ==========================================
 */

export type UpdateProfileDTO = z.infer<typeof UpdateProfilePayloadDTO>;
export type ChangePasswordDTO = z.infer<typeof ChangePasswordPayloadDTO>;
export type RevokeSessionDTO = z.infer<typeof RevokeSessionPayloadDTO>;
export type GetSessionsQueryDTO = z.infer<typeof GetSessionsQueryPayloadDTO>;
export type GetSettingsDTO = any; // Empty for GET
export type UpdateSettingsDTO = z.infer<typeof UpdateSettingsPayloadDTO>;

export type CreateUserDTO = z.infer<typeof CreateUserPayloadDTO>;
export type UpdateUserDTO = z.infer<typeof UpdateUserPayloadDTO>;
export type ChangeUserStatusDTO = z.infer<typeof ChangeUserStatusPayloadDTO>;
export type ResetUserPasswordDTO = z.infer<typeof ResetUserPasswordPayloadDTO>;
export type ListUsersQueryDTO = z.infer<typeof ListUsersQueryPayloadDTO>;

// Legacy DTOs (kept for backward compatibility)
export const UserCreate = CreateUserPayloadDTO;
export const UserUpdate = UpdateUserPayloadDTO;
export const UserCond = ListUsersQueryPayloadDTO;
export const UserBan = z.object({
  userId: z.string(),
});

export type UserCreateDTO = z.infer<typeof UserCreate>;
export type UserUpdateDTO = z.infer<typeof UserUpdate>;
export type UserCondDTO = z.infer<typeof UserCond>;
export type UserBanDTO = z.infer<typeof UserBan>;