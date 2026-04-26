"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAuditLog = void 0;
const logger_1 = require("../system/log/logger");
const index_1 = require("./index");
const toStringMap = (meta) => {
    if (!meta)
        return {};
    const out = {};
    for (const [key, value] of Object.entries(meta)) {
        if (value === undefined || value === null)
            continue;
        out[key] = typeof value === "string" ? value : JSON.stringify(value);
    }
    return out;
};
const getIp = (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
        return forwarded.split(",")[0].trim();
    }
    return req.socket.remoteAddress ?? "";
};
const getDevice = (req) => {
    const ua = String(req.headers["user-agent"] ?? "").toLowerCase();
    return /mobile|android|iphone|ipad/.test(ua) ? "mobile" : "desktop";
};
const writeAuditLog = async (prisma, req, input) => {
    try {
        await (0, index_1.createAuditLog)(prisma, {
            action: input.action,
            description: input.description,
            category: input.category,
            severity: input.severity,
            actorId: req.user?.id,
            actorEmail: req.user?.email ?? "system@cinemax.vn",
            actorRole: req.user?.role?.toLowerCase() ?? "system",
            targetType: input.targetType,
            targetLabel: input.targetLabel,
            targetId: input.targetId,
            meta: toStringMap(input.meta),
            ip: getIp(req),
            device: getDevice(req),
            location: String(req.headers["x-geo-country"] ?? ""),
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger_1.logger.warn("[AuditLog] Failed to persist entry", {
            action: input.action,
            error: message,
        });
    }
};
exports.writeAuditLog = writeAuditLog;
