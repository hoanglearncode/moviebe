import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { protect, requireRole } from "../../share/middleware/auth";
import { successResponse, errorResponse } from "../../share/transport/http-server";

const adminGuard = [...protect(requireRole("ADMIN"))];

const DEFAULT_SETTINGS: Record<string, string> = {
  siteName: "CineMax",
  siteUrl: "https://cinemax.vn",
  supportEmail: "support@cinemax.vn",
  maxUploadSizeMB: "5120",
  defaultQuality: "auto",
  maintenanceMode: "false",
  registrationOpen: "true",
  ownerApprovalRequired: "true",
  maxDevicesPerUser: "4",
  sessionTimeoutHours: "720",
  timezone: "Asia/Ho_Chi_Minh",
  defaultLanguage: "vi",
};

async function getSettings(prisma: PrismaClient): Promise<Record<string, string>> {
  const rows = await prisma.systemSetting.findMany();
  const result: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export function buildAdminSystemSettingsRouter(prisma: PrismaClient): Router {
  const router = Router();

  // GET /v1/admin/system-settings — returns flat config object
  router.get("/", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const settings = await getSettings(prisma);
      successResponse(res, settings);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // PATCH /v1/admin/system-settings — upsert key-value pairs
  router.patch("/", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const updates = req.body as Record<string, string>;

      if (!updates || typeof updates !== "object") {
        return errorResponse(res, 400, "Request body must be an object of key-value pairs");
      }

      await Promise.all(
        Object.entries(updates).map(([key, value]) =>
          prisma.systemSetting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
          }),
        ),
      );

      const settings = await getSettings(prisma);
      successResponse(res, settings, "Settings updated");
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  return router;
}
