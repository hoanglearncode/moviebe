"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const winston_1 = __importDefault(require("winston"));
const logDirectory = node_path_1.default.resolve(process.cwd(), "logs");
if (!node_fs_1.default.existsSync(logDirectory)) {
    node_fs_1.default.mkdirSync(logDirectory, { recursive: true });
}
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaText = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${message}${metaText}`;
}));
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || "info",
    defaultMeta: { service: "movie-be" },
    transports: [
        new winston_1.default.transports.File({
            filename: node_path_1.default.join(logDirectory, "app.log"),
            format: fileFormat,
        }),
    ],
});
if (process.env.NODE_ENV !== "test") {
    exports.logger.add(new winston_1.default.transports.Console({
        format: consoleFormat,
    }));
}
