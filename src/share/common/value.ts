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

    // ADMIN_INIT_EMAIL: z.string(),
    // ADMIN_INIT_PASSWORD: z.string(),

    DATABASE_URL: z.string(),

    JWT_ACCESS_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),
    JWT_ACCESS_EXPIRES: z.string(),
    JWT_REFRESH_EXPIRES: z.string(),

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



  })
  .parse(process.env);
