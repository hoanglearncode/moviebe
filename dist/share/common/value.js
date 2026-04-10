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
    ADMIN_INIT_EMAIL: zod_1.z.string().optional(),
    ADMIN_INIT_PASSWORD: zod_1.z.string().optional(),
    DATABASE_URL: zod_1.z.string(),
    JWT_ACCESS_SECRET: zod_1.z.string(),
    JWT_REFRESH_SECRET: zod_1.z.string(),
    JWT_ACCESS_EXPIRES: zod_1.z.string(),
    JWT_REFRESH_EXPIRES: zod_1.z.string(),
    AUTH_CONCURRENT_LOCK_TTL_MS: zod_1.z.coerce.number().int().positive().default(5000),
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    FACEBOOK_CLIENT_ID: zod_1.z.string().optional(),
    FACEBOOK_CLIENT_SECRET: zod_1.z.string().optional(),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.coerce.number().int().positive().default(587),
    SMTP_SECURE: stringToBoolean.default(false),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    MAIL_FROM_EMAIL: zod_1.z.string().email().optional(),
    MAIL_FROM_NAME: zod_1.z.string().default("Movie App"),
    FRONTEND_URL: zod_1.z.string().url().default("http://localhost:3000"),
    REDIS_HOST: zod_1.z.string().default("127.0.0.1"),
    REDIS_PORT: zod_1.z.coerce.number().int().positive().default(6379),
    REDIS_USERNAME: zod_1.z.string().optional(),
    REDIS_PASSWORD: zod_1.z.string().optional(),
    REDIS_DB: zod_1.z.coerce.number().int().min(0).default(0),
    QUEUE_PREFIX: zod_1.z.string().default("movie-be"),
    QUEUE_JOB_ATTEMPTS: zod_1.z.coerce.number().int().positive().default(3),
    QUEUE_JOB_BACKOFF_MS: zod_1.z.coerce.number().int().positive().default(1000),
    QUEUE_REMOVE_ON_COMPLETE_COUNT: zod_1.z.coerce.number().int().positive().default(100),
    QUEUE_REMOVE_ON_FAIL_COUNT: zod_1.z.coerce.number().int().positive().default(500),
    PUSHER_APP_ID: zod_1.z.string().optional(),
    PUSHER_KEY: zod_1.z.string().optional(),
    PUSHER_SECRET: zod_1.z.string().optional(),
    PUSHER_CLUSTER: zod_1.z.string().optional(),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().optional(),
    CLOUDINARY_API_SECRET: zod_1.z.string().optional(),
    CLOUDINARY_API_KEY: zod_1.z.string().optional()
})
    .parse(process.env);
