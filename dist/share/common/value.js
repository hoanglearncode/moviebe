import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
const stringToBoolean = z
    .string()
    .optional()
    .transform((value) => value === "true");
export const ENV = z
    .object({
    PORT: z.string().default("3000"),
    ADMIN_INIT_EMAIL: z.string().optional(),
    ADMIN_INIT_PASSWORD: z.string().optional(),
    DATABASE_URL: z.string(),
    JWT_ACCESS_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),
    JWT_ACCESS_EXPIRES: z.string(),
    JWT_REFRESH_EXPIRES: z.string(),
    AUTH_CONCURRENT_LOCK_TTL_MS: z.coerce.number().int().positive().default(5000),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    FACEBOOK_CLIENT_ID: z.string().optional(),
    FACEBOOK_CLIENT_SECRET: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: stringToBoolean.default(false),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM_EMAIL: z.string().email().optional(),
    MAIL_FROM_NAME: z.string().default("Movie App"),
    FRONTEND_URL: z.string().url().default("http://localhost:3000"),
    REDIS_HOST: z.string().default("127.0.0.1"),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_USERNAME: z.string().optional(),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_DB: z.coerce.number().int().min(0).default(0),
    QUEUE_PREFIX: z.string().default("movie-be"),
    QUEUE_JOB_ATTEMPTS: z.coerce.number().int().positive().default(3),
    QUEUE_JOB_BACKOFF_MS: z.coerce.number().int().positive().default(1000),
    QUEUE_REMOVE_ON_COMPLETE_COUNT: z.coerce.number().int().positive().default(100),
    QUEUE_REMOVE_ON_FAIL_COUNT: z.coerce.number().int().positive().default(500),
    PUSHER_APP_ID: z.string().optional(),
    PUSHER_KEY: z.string().optional(),
    PUSHER_SECRET: z.string().optional(),
    PUSHER_CLUSTER: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
})
    .parse(process.env);
