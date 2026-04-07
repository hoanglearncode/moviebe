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
  name: z.string().trim().min(1, "name is required").optional(),
});

export const LoginPayloadDTO = z.object({
  emailOrUsername: z.string().trim().min(1, "email or username is required"),
  password: z.string().min(8, "password must have at least 8 characters"),
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
  newPassword: z
    .string()
    .min(8, "new password must have at least 8 characters"),
});

export type RegisterDTO = z.infer<typeof RegisterPayloadDTO>;
export type LoginDTO = z.infer<typeof LoginPayloadDTO>;
export type VerifyEmailDTO = z.infer<typeof VerifyEmailPayloadDTO>;
export type ResendVerificationDTO = z.infer<
  typeof ResendVerificationPayloadDTO
>;
export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordPayloadDTO>;
export type ChangePasswordDTO = z.infer<typeof ChangePasswordPayloadDTO>;
