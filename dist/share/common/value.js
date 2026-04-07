"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const stringToBoolean = zod_1.z
    .string()
    .optional()
    .transform((value) => value === "true");
exports.ENV = zod_1.z
    .object({
    PORT: zod_1.z.string().default("3000"),
    // ADMIN_INIT_EMAIL: z.string(),
    // ADMIN_INIT_PASSWORD: z.string(),
    DATABASE_URL: zod_1.z.string(),
    JWT_ACCESS_SECRET: zod_1.z.string(),
    JWT_REFRESH_SECRET: zod_1.z.string(),
    JWT_ACCESS_EXPIRES: zod_1.z.string(),
    JWT_REFRESH_EXPIRES: zod_1.z.string(),
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.coerce.number().int().positive().default(587),
    SMTP_SECURE: stringToBoolean.default(false),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    MAIL_FROM_EMAIL: zod_1.z.string().email().optional(),
    MAIL_FROM_NAME: zod_1.z.string().default("Movie App"),
    FRONTEND_URL: zod_1.z.string().url().default("http://localhost:3000"),
    // GOOGLE_CLIENT_ID: z.string(),
    // GOOGLE_CLIENT_SECRET: z.string(),
    // FACEBOOK_CLIENT_ID: z.string(),
    // FACEBOOK_CLIENT_SECRET: z.string(),
})
    .parse(process.env);
