"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const logger_1 = require("./logger");
function requestLogger(req, res, next) {
    const startedAt = Date.now();
    res.on("finish", () => {
        logger_1.logger.info("HTTP request completed", {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
            ip: req.ip,
        });
    });
    next();
}
