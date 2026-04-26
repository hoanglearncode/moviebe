"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdminSystemSettingsRouter = buildAdminSystemSettingsRouter;
const express_1 = require("express");
const auth_1 = require("../../share/middleware/auth");
const http_server_1 = require("../../share/transport/http-server");
const helper_1 = require("../admin-audit-logs/helper");
const adminGuard = [...(0, auth_1.protect)((0, auth_1.requireRole)("ADMIN"))];
const DEFAULT_SETTINGS = {
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
async function getSettings(prisma) {
    const rows = await prisma.systemSetting.findMany();
    const result = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
        result[row.key] = row.value;
    }
    return result;
}
function buildAdminSystemSettingsRouter(prisma) {
    const router = (0, express_1.Router)();
    // GET /v1/admin/system-settings — returns flat config object
    router.get("/", ...adminGuard, async (req, res) => {
        try {
            const settings = await getSettings(prisma);
            (0, http_server_1.successResponse)(res, settings);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    // PATCH /v1/admin/system-settings — upsert key-value pairs
    router.patch("/", ...adminGuard, async (req, res) => {
        try {
            const updates = req.body;
            if (!updates || typeof updates !== "object") {
                return (0, http_server_1.errorResponse)(res, 400, "Request body must be an object of key-value pairs");
            }
            await Promise.all(Object.entries(updates).map(([key, value]) => prisma.systemSetting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) },
            })));
            const settings = await getSettings(prisma);
            await (0, helper_1.writeAuditLog)(prisma, req, {
                action: "update_system_settings",
                description: `Updated system settings (${Object.keys(updates).length} keys)`,
                category: "system",
                severity: "high",
                targetType: "system_settings",
                targetLabel: "global",
                meta: {
                    keys: Object.keys(updates).join(","),
                },
            });
            (0, http_server_1.successResponse)(res, settings, "Settings updated");
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    return router;
}
