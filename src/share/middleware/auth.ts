import { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { Role, UserStatus } from "@prisma/client";
import { ENV } from "../common/value";
import { ErrorCode } from "../model/error-code";
import { prisma } from "../component/prisma";
import { errorResponse } from "../transport/http-server";
import { logger } from "../../modules/system/log/logger";
import { AuthorizationUseCase } from "../../modules/user/usecase/authorization.usecase";
import { PermissionCode } from "../security/permissions";

const authorizationUseCase = new AuthorizationUseCase();

/**
 * Extended Express Request with authenticated user context
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role: string;
        status?: string;
        permissionsOverride?: PermissionCode[];
        permissions?: string[];
      };
    }
  }
}

export type AuthenticatedRequest = Request;

type JwtAuthPayload = jwt.JwtPayload & {
  sub?: string;
  email?: string;
  scope?: string;
  status?: string;
};

const extractBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7).trim();
};

const decodeAccessToken = (token: string): JwtAuthPayload => {
  const payload = jwt.verify(token, ENV.JWT_ACCESS_SECRET, {
    algorithms: ["HS512"],
  });

  if (typeof payload === "string") {
    throw new Error("Invalid token payload");
  }

  return payload as JwtAuthPayload;
};

const assignUserFromPayload = (req: AuthenticatedRequest, payload: JwtAuthPayload): void => {
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

const syncUserFromDatabase = async (req: AuthenticatedRequest): Promise<boolean> => {
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
    } as any,
  } as any);

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

const handleAuthFailure = (
  res: Response,
  message: string,
  statusCode: number = 401,
  code: ErrorCode = ErrorCode.UNAUTHORIZED,
): void => {
  errorResponse(res, statusCode, message, code.toString());
};

/**
 * Authentication Middleware - Verifies JWT access token
 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
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
    } catch (error: any) {
      logger.error("[Auth Middleware] Token verification failed", {
        message: error.message,
      });
      return handleAuthFailure(res, "Invalid or expired token");
    }
  })().catch((error: any) => {
    logger.error("[Auth Middleware] Unexpected error", {
      message: error.message,
    });
    return handleAuthFailure(res, "Invalid or expired token");
  });
};

/**
 * Optional Auth Middleware - Doesn't fail if no token
 */
export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const token = extractBearerToken(req);
    if (token) {
      const payload = decodeAccessToken(token);
      assignUserFromPayload(req, payload);
    }

    next();
  } catch (error: any) {
    logger.warn("[Optional Auth Middleware] Token verification failed, continuing without auth", {
      message: error.message,
    });
    next();
  }
};

/**
 * Admin Check Middleware - Requires admin role
 */
export const requireRole = (...roles: string[]): RequestHandler => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return handleAuthFailure(res, "Unauthorized");
    }

    if (!roles.includes(req.user.role)) {
      return handleAuthFailure(
        res,
        `Access denied. Required roles: ${roles.join(", ")}`,
        403,
        ErrorCode.UNAUTHORIZED,
      );
    }

    next();
  };
};

export const requirePermission = (...permissions: PermissionCode[]): RequestHandler => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return handleAuthFailure(res, "Unauthorized");
    }

    if (!authorizationUseCase.hasAllPermissions(req.user, permissions)) {
      return handleAuthFailure(
        res,
        `Access denied. Required permissions: ${permissions.join(", ")}`,
        403,
        ErrorCode.UNAUTHORIZED,
      );
    }

    next();
  };
};

export const requireAnyPermission = (...permissions: PermissionCode[]): RequestHandler => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return handleAuthFailure(res, "Unauthorized");
    }

    if (!authorizationUseCase.hasAnyPermission(req.user, permissions)) {
      return handleAuthFailure(
        res,
        `Access denied. Required any permission: ${permissions.join(", ")}`,
        403,
        ErrorCode.UNAUTHORIZED,
      );
    }

    next();
  };
};

export const requireSelfOrPermission = (
  resolveOwnerId: (req: AuthenticatedRequest) => string | undefined | null,
  permission: PermissionCode,
): RequestHandler => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return handleAuthFailure(res, "Unauthorized");
    }

    const ownerId = resolveOwnerId(req);
    if (
      authorizationUseCase.canAccessOwnResource(req.user.id, ownerId) ||
      authorizationUseCase.hasPermission(req.user, permission)
    ) {
      return next();
    }

    return handleAuthFailure(res, "Access denied", 403, ErrorCode.UNAUTHORIZED);
  };
};

export const requireActiveUser: RequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
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

export const authenticate = (...guards: RequestHandler[]): RequestHandler[] => [
  authMiddleware,
  ...guards,
];

export const protect = (...guards: RequestHandler[]): RequestHandler[] => [
  authMiddleware,
  requireActiveUser,
  ...guards,
];
