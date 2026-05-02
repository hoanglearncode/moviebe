import fs from "node:fs";
import path from "node:path";
import winston from "winston";
const logDirectory = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}
const fileFormat = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json());
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaText = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${message}${metaText}`;
}));
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    defaultMeta: { service: "movie-be" },
    transports: [
        new winston.transports.File({
            filename: path.join(logDirectory, "app.log"),
            format: fileFormat,
        }),
    ],
});
if (process.env.NODE_ENV !== "test") {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
    }));
}
