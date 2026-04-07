"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePasswordPayloadDTO = exports.ForgotPasswordPayloadDTO = exports.ResendVerificationPayloadDTO = exports.VerifyEmailPayloadDTO = exports.FacebookLoginPayloadDTO = exports.GoogleLoginTokenCallbackPayloadDTO = exports.GoogleLoginPayloadDTO = exports.RefreshTokenPayloadDTO = exports.LoginPayloadDTO = exports.RegisterPayloadDTO = void 0;
const zod_1 = __importDefault(require("zod"));
exports.RegisterPayloadDTO = zod_1.default.object({
    email: zod_1.default.string().trim().toLowerCase().email("invalid email"),
    password: zod_1.default.string().min(8, "password must have at least 8 characters"),
    username: zod_1.default
        .string()
        .trim()
        .min(3, "username too short")
        .max(50, "username max 50 characters")
        .optional(),
    name: zod_1.default.string().trim().min(1, "name is required").optional(),
});
exports.LoginPayloadDTO = zod_1.default.object({
    emailOrUsername: zod_1.default.string().trim().min(1, "email or username is required"),
    password: zod_1.default.string().min(8, "password must have at least 8 characters"),
});
exports.RefreshTokenPayloadDTO = zod_1.default.object({
    refreshToken: zod_1.default.string().trim().min(1, "token is required")
});
exports.GoogleLoginPayloadDTO = zod_1.default.object({
    credential: zod_1.default.string().trim().min(1, "credential is required")
});
exports.GoogleLoginTokenCallbackPayloadDTO = zod_1.default.object({
    accessToken: zod_1.default.string().trim().min(1, "accessToken is required")
});
exports.FacebookLoginPayloadDTO = zod_1.default.object({
    accessToken: zod_1.default.string().trim().min(1, "accessToken is required")
});
exports.VerifyEmailPayloadDTO = zod_1.default.object({
    token: zod_1.default.string().trim().min(1, "token is required"),
});
exports.ResendVerificationPayloadDTO = zod_1.default.object({
    email: zod_1.default.string().trim().toLowerCase().email("invalid email"),
});
exports.ForgotPasswordPayloadDTO = zod_1.default.object({
    email: zod_1.default.string().trim().toLowerCase().email("invalid email"),
});
exports.ChangePasswordPayloadDTO = zod_1.default.object({
    token: zod_1.default.string().trim().min(1, "token is required"),
    newPassword: zod_1.default
        .string()
        .min(8, "new password must have at least 8 characters"),
});
