import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorResponse } from "../transport/http-server";
import { logger } from "../../modules/system/logger";

/**
 * Extended Express Request with user data
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication Middleware - Verifies JWT token
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, 401, "Missing or invalid authorization header");
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || "your-secret-key";

    const decoded = jwt.verify(token, secret) as any;
    
    if (!decoded.id || !decoded.email) {
      return errorResponse(res, 401, "Invalid token payload");
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || "USER",
    };

    next();
  } catch (error: any) {
    logger.error("[Auth Middleware] Token verification failed:", error.message);
    return errorResponse(res, 401, "Invalid or expired token");
  }
};

/**
 * Optional Auth Middleware - Doesn't fail if no token
 */
export const optionalAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const secret = process.env.JWT_SECRET || "your-secret-key";

      const decoded = jwt.verify(token, secret) as any;
      
      if (decoded.id && decoded.email) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role || "USER",
        };
      }
    }

    next();
  } catch (error: any) {
    logger.warn("[Optional Auth Middleware] Token verification failed, continuing without auth:", error.message);
    next();
  }
};

/**
 * Admin Check Middleware - Requires admin role
 */
export const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== "ADMIN") {
    return errorResponse(res, 403, "Access denied. Admin role required.");
  }
  next();
};

/**
 * Partner Check Middleware - Requires partner role
 */
export const partnerMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || (req.user.role !== "PARTNER" && req.user.role !== "ADMIN")) {
    return errorResponse(res, 403, "Access denied. Partner role required.");
  }
  next();
};

/**
 * Role Check Middleware Factory
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(res, 403, `Access denied. Required roles: ${roles.join(", ")}`);
    }
    next();
  };
};
