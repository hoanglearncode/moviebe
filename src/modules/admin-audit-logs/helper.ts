import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import { logger } from "../system/log/logger";
import { createAuditLog } from "./index";

type AuditSeverity = "low" | "medium" | "high" | "critical";

type AuditInput = {
  action: string;
  description: string;
  category: string;
  severity: AuditSeverity;
  targetType?: string;
  targetLabel?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
};

const toStringMap = (meta?: Record<string, unknown>): Record<string, string> => {
  if (!meta) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined || value === null) continue;
    out[key] = typeof value === "string" ? value : JSON.stringify(value);
  }
  return out;
};

const getIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress ?? "";
};

const getDevice = (req: Request): string => {
  const ua = String(req.headers["user-agent"] ?? "").toLowerCase();
  return /mobile|android|iphone|ipad/.test(ua) ? "mobile" : "desktop";
};

export const writeAuditLog = async (
  prisma: PrismaClient,
  req: Request,
  input: AuditInput,
): Promise<void> => {
  try {
    await createAuditLog(prisma, {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("[AuditLog] Failed to persist entry", {
      action: input.action,
      error: message,
    });
  }
};
