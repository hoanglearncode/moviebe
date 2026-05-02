import jwt from "jsonwebtoken";
import { Role, UserStatus } from "@prisma/client";
import { ENV } from "@/share/common/value";
import { ErrorCode } from "@/share/model/error-code";
import { prisma } from "@/share/component/prisma";
import { errorResponse } from "@/share/transport/http-server";
import { logger } from "@/modules/system/log/logger";
import { AuthorizationUseCase } from "@/modules/admin-manage/admin-user/usecase/authorization.usecase";
const authorizationUseCase = new AuthorizationUseCase();
const extractBearerToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    return authHeader.substring(7).trim();
};
const decodeAccessToken = (token) => {
    const payload = jwt.verify(token, ENV.JWT_ACCESS_SECRET, {
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
        status: String(payload.status ?? UserStatus.ACTIVE),
        permissionsOverride: [],
        permissions: authorizationUseCase.resolvePermissions({
            role: String(payload.scope ?? Role.USER),
            permissionsOverride: [],
        }),
    };
};
const syncUserFromDatabase = async (req) => {
    if (!req.user?.id) {
        return false;
    }
    const dbUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            email: true,
            role: true,
            status: true,
            permissionsOverride: true,
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
        permissionsOverride: authorizationUseCase.normalizePermissionsOverride(dbUser.permissionsOverride),
        permissions: authorizationUseCase.resolvePermissions({
            role: dbUser.role,
            permissionsOverride: dbUser.permissionsOverride,
        }),
    };
    return true;
};
const handleAuthFailure = (res, message, statusCode = 401, code = ErrorCode.UNAUTHORIZED) => {
    errorResponse(res, statusCode, message, code.toString());
};
/**
 * Authentication Middleware - Verifies JWT access token
 */
export const authMiddleware = (req, res, next) => {
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
            logger.error("[Auth Middleware] Token verification failed", {
                message: error.message,
            });
            return handleAuthFailure(res, "Invalid or expired token");
        }
    })().catch((error) => {
        logger.error("[Auth Middleware] Unexpected error", {
            message: error.message,
        });
        return handleAuthFailure(res, "Invalid or expired token");
    });
};
/**
 * Optional Auth Middleware - Doesn't fail if no token
 */
export const optionalAuthMiddleware = (req, _res, next) => {
    (async () => {
        try {
            const token = extractBearerToken(req);
            if (!token) {
                return next();
            }
            const payload = decodeAccessToken(token);
            assignUserFromPayload(req, payload);
            const synced = await syncUserFromDatabase(req);
            if (!synced) {
                req.user = undefined;
            }
            next();
        }
        catch (error) {
            logger.warn("[Optional Auth Middleware] Token verification failed, continuing without auth", {
                message: error.message,
            });
            req.user = undefined;
            next();
        }
    })().catch((error) => {
        logger.warn("[Optional Auth Middleware] Unexpected error, continuing without auth", {
            message: error.message,
        });
        req.user = undefined;
        next();
    });
};
/**
 * Admin Check Middleware - Requires admin role
 */
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return handleAuthFailure(res, "Unauthorized");
        }
        if (!roles.includes(req.user.role)) {
            return handleAuthFailure(res, `Access denied. Required roles: ${roles.join(", ")}`, 403, ErrorCode.UNAUTHORIZED);
        }
        next();
    };
};
export const requirePermission = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return handleAuthFailure(res, "Unauthorized");
        }
        if (!authorizationUseCase.hasAllPermissions(req.user, permissions)) {
            return handleAuthFailure(res, `Access denied. Required permissions: ${permissions.join(", ")}`, 403, ErrorCode.UNAUTHORIZED);
        }
        next();
    };
};
export const requireAnyPermission = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return handleAuthFailure(res, "Unauthorized");
        }
        if (!authorizationUseCase.hasAnyPermission(req.user, permissions)) {
            return handleAuthFailure(res, `Access denied. Required any permission: ${permissions.join(", ")}`, 403, ErrorCode.UNAUTHORIZED);
        }
        next();
    };
};
export const requireSelfOrPermission = (resolveOwnerId, permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return handleAuthFailure(res, "Unauthorized");
        }
        const ownerId = resolveOwnerId(req);
        if (authorizationUseCase.canAccessOwnResource(req.user.id, ownerId) ||
            authorizationUseCase.hasPermission(req.user, permission)) {
            return next();
        }
        return handleAuthFailure(res, "Access denied", 403, ErrorCode.UNAUTHORIZED);
    };
};
export const requireActiveUser = (req, res, next) => {
    if (!req.user) {
        return handleAuthFailure(res, "Unauthorized");
    }
    if (req.user.status && req.user.status !== UserStatus.ACTIVE) {
        return handleAuthFailure(res, "Account is unavailable", 403, ErrorCode.ACCOUNT_INACTIVE);
    }
    next();
};
export const adminMiddleware = requireRole("ADMIN");
export const partnerMiddleware = requireRole("PARTNER", "ADMIN");
export const authenticate = (...guards) => [
    authMiddleware,
    ...guards,
];
export const protect = (...guards) => [
    authMiddleware,
    requireActiveUser,
    ...guards,
];
