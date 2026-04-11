"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = exports.authenticate = exports.partnerMiddleware = exports.adminMiddleware = exports.requireActiveUser = exports.requireRole = exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const value_1 = require("../common/value");
const error_code_1 = require("../model/error-code");
const prisma_1 = require("../component/prisma");
const http_server_1 = require("../transport/http-server");
const logger_1 = require("../../modules/system/log/logger");
const extractBearerToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    return authHeader.substring(7).trim();
};
const decodeAccessToken = (token) => {
    const payload = jsonwebtoken_1.default.verify(token, value_1.ENV.JWT_ACCESS_SECRET, {
        algorithms: ["HS512"],
    });
    if (typeof payload === "string") {
        throw new Error("Invalid token payload");
    }
    return payload;
};
const assignUserFromPayload = (req, payload) => {
    if (!payload.sub || !payload.email) {
        throw new Error("Invalid token payload");
    }
    req.user = {
        id: String(payload.sub),
        email: String(payload.email),
        role: String(payload.scope ?? "USER"),
        status: String(payload.status ?? client_1.UserStatus.ACTIVE),
    };
};
const syncUserFromDatabase = async (req) => {
    if (!req.user?.id) {
        return false;
    }
    const dbUser = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            email: true,
            role: true,
            status: true,
        },
    });
    if (!dbUser) {
        return false;
    }
    req.user = {
        ...req.user,
        email: dbUser.email,
        role: dbUser.role,
        status: dbUser.status,
    };
    return true;
};
const handleAuthFailure = (res, message, statusCode = 401, code = error_code_1.ErrorCode.UNAUTHORIZED) => {
    (0, http_server_1.errorResponse)(res, statusCode, message, code.toString());
};
/**
 * Authentication Middleware - Verifies JWT access token
 */
const authMiddleware = (req, res, next) => {
    (async () => {
        try {
            const token = extractBearerToken(req);
            if (!token) {
                return handleAuthFailure(res, "Missing or invalid authorization header");
            }
            const payload = decodeAccessToken(token);
            assignUserFromPayload(req, payload);
            const synced = await syncUserFromDatabase(req);
            if (!synced) {
                return handleAuthFailure(res, "Invalid or expired token");
            }
            next();
        }
        catch (error) {
            logger_1.logger.error("[Auth Middleware] Token verification failed", {
                message: error.message,
            });
            return handleAuthFailure(res, "Invalid or expired token");
        }
    })().catch((error) => {
        logger_1.logger.error("[Auth Middleware] Unexpected error", {
            message: error.message,
        });
        return handleAuthFailure(res, "Invalid or expired token");
    });
};
exports.authMiddleware = authMiddleware;
/**
 * Optional Auth Middleware - Doesn't fail if no token
 */
const optionalAuthMiddleware = (req, _res, next) => {
    try {
        const token = extractBearerToken(req);
        if (token) {
            const payload = decodeAccessToken(token);
            assignUserFromPayload(req, payload);
        }
        next();
    }
    catch (error) {
        logger_1.logger.warn("[Optional Auth Middleware] Token verification failed, continuing without auth", {
            message: error.message,
        });
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
/**
 * Admin Check Middleware - Requires admin role
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return handleAuthFailure(res, "Unauthorized");
        }
        if (!roles.includes(req.user.role)) {
            return handleAuthFailure(res, `Access denied. Required roles: ${roles.join(", ")}`, 403, error_code_1.ErrorCode.UNAUTHORIZED);
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireActiveUser = (req, res, next) => {
    if (!req.user) {
        return handleAuthFailure(res, "Unauthorized");
    }
    if (req.user.status && req.user.status !== client_1.UserStatus.ACTIVE) {
        return handleAuthFailure(res, "Account is unavailable", 403, error_code_1.ErrorCode.ACCOUNT_INACTIVE);
    }
    next();
};
exports.requireActiveUser = requireActiveUser;
exports.adminMiddleware = (0, exports.requireRole)("ADMIN");
exports.partnerMiddleware = (0, exports.requireRole)("PARTNER", "ADMIN");
const authenticate = (...guards) => [
    exports.authMiddleware,
    ...guards,
];
exports.authenticate = authenticate;
const protect = (...guards) => [
    exports.authMiddleware,
    exports.requireActiveUser,
    ...guards,
];
exports.protect = protect;
