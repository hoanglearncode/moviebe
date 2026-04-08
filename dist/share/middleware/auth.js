"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.partnerMiddleware = exports.adminMiddleware = exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_server_1 = require("../transport/http-server");
const logger_1 = require("../../modules/system/logger");
/**
 * Authentication Middleware - Verifies JWT token
 */
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return (0, http_server_1.errorResponse)(res, 401, "Missing or invalid authorization header");
        }
        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET || "your-secret-key";
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        if (!decoded.id || !decoded.email) {
            return (0, http_server_1.errorResponse)(res, 401, "Invalid token payload");
        }
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role || "USER",
        };
        next();
    }
    catch (error) {
        logger_1.logger.error("[Auth Middleware] Token verification failed:", error.message);
        return (0, http_server_1.errorResponse)(res, 401, "Invalid or expired token");
    }
};
exports.authMiddleware = authMiddleware;
/**
 * Optional Auth Middleware - Doesn't fail if no token
 */
const optionalAuthMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const secret = process.env.JWT_SECRET || "your-secret-key";
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            if (decoded.id && decoded.email) {
                req.user = {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role || "USER",
                };
            }
        }
        next();
    }
    catch (error) {
        logger_1.logger.warn("[Optional Auth Middleware] Token verification failed, continuing without auth:", error.message);
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
/**
 * Admin Check Middleware - Requires admin role
 */
const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== "ADMIN") {
        return (0, http_server_1.errorResponse)(res, 403, "Access denied. Admin role required.");
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
/**
 * Partner Check Middleware - Requires partner role
 */
const partnerMiddleware = (req, res, next) => {
    if (!req.user || (req.user.role !== "PARTNER" && req.user.role !== "ADMIN")) {
        return (0, http_server_1.errorResponse)(res, 403, "Access denied. Partner role required.");
    }
    next();
};
exports.partnerMiddleware = partnerMiddleware;
/**
 * Role Check Middleware Factory
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return (0, http_server_1.errorResponse)(res, 403, `Access denied. Required roles: ${roles.join(", ")}`);
        }
        next();
    };
};
exports.requireRole = requireRole;
