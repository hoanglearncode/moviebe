import z from "zod";
export const RegisterPayloadDTO = z.object({
    email: z.string().trim().toLowerCase().email("invalid email"),
    password: z.string().min(8, "password must have at least 8 characters"),
    username: z
        .string()
        .trim()
        .min(3, "username too short")
        .max(50, "username max 50 characters")
        .optional(),
    name: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().trim().min(1, "name cannot be blank").optional()),
    permissions_override: z.json().nullable().optional(),
});
export const LoginPayloadDTO = z.object({
    emailOrUsername: z
        .string()
        .trim()
        .min(1, "email or username is required")
        .transform((value) => (value.includes("@") ? value.toLowerCase() : value)),
    password: z.string().min(8, "password must have at least 8 characters"),
    remember: z.boolean().optional().default(false),
});
export const RefreshTokenPayloadDTO = z.object({
    refreshToken: z.string().trim().min(1, "token is required"),
});
export const GoogleLoginPayloadDTO = z.object({
    credential: z.string().trim().min(1, "credential is required"),
});
export const GoogleLoginTokenCallbackPayloadDTO = z.object({
    accessToken: z.string().trim().min(1, "accessToken is required"),
});
export const FacebookLoginPayloadDTO = z.object({
    accessToken: z.string().trim().min(1, "accessToken is required"),
});
export const VerifyEmailPayloadDTO = z.object({
    token: z.string().trim().min(1, "token is required"),
});
export const ResendVerificationPayloadDTO = z.object({
    email: z.string().trim().toLowerCase().email("invalid email"),
});
export const ForgotPasswordPayloadDTO = z.object({
    email: z.string().trim().toLowerCase().email("invalid email"),
});
export const ChangePasswordPayloadDTO = z.object({
    token: z.string().trim().min(1, "token is required"),
    newPassword: z.string().min(8, "new password must have at least 8 characters"),
});
