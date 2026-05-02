import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getSystemSettingsService } from "@/modules/admin-manage/admin-system-settings";
import { ENV } from "@/share/common/value";
import { logger } from "@/modules/system/log/logger";

const BYPASS_PREFIXES = [
  "/v1/auth/login",
  "/v1/auth/refresh-token",
  "/v1/auth/google",
  "/v1/auth/facebook",
];

function extractRoleFromToken(req: Request): string | null {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return null;
    const token = auth.substring(7).trim();
    const payload = jwt.verify(token, ENV.JWT_ACCESS_SECRET, { algorithms: ["HS512"] }) as any;
    return String(payload.scope ?? "");
  } catch {
    return null;
  }
}

export const maintenanceModeGuard = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const service = getSystemSettingsService();
    const isMaintenance = await service.isMaintenanceMode();

    if (!isMaintenance) return next();

    // Admins can always bypass maintenance
    const role = extractRoleFromToken(req);
    if (role === "ADMIN") return next();

    // Allow auth endpoints so admin can log in during maintenance
    if (BYPASS_PREFIXES.some((p) => req.path.startsWith(p))) return next();

    res.status(503).json({
      success: false,
      error: {
        code: "MAINTENANCE_MODE",
        message: "Hệ thống đang bảo trì. Vui lòng thử lại sau.",
      },
    });
  } catch (err: any) {
    logger.warn("[Maintenance] Failed to check maintenance mode, allowing request", {
      message: err.message,
    });
    next();
  }
};
