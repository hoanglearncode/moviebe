"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdminAnalyticsRouter = buildAdminAnalyticsRouter;
const express_1 = require("express");
const auth_1 = require("../../share/middleware/auth");
const http_server_1 = require("../../share/transport/http-server");
const usecase_1 = require("./usecase");
const adminGuard = [...(0, auth_1.protect)((0, auth_1.requireRole)("ADMIN"))];
function buildAdminAnalyticsRouter(prisma) {
    const router = (0, express_1.Router)();
    const useCase = new usecase_1.AdminAnalyticsUseCase(prisma);
    router.get("/overview", ...adminGuard, async (req, res) => {
        try {
            const data = await useCase.getOverview();
            (0, http_server_1.successResponse)(res, data);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    router.get("/revenue", ...adminGuard, async (req, res) => {
        try {
            const period = req.query.period || "30d";
            const validPeriods = ["7d", "30d", "90d", "1y"];
            if (!validPeriods.includes(period)) {
                return (0, http_server_1.errorResponse)(res, 400, "Invalid period. Use: 7d, 30d, 90d, 1y");
            }
            const data = await useCase.getRevenueTrend(period);
            (0, http_server_1.successResponse)(res, data);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    router.get("/users", ...adminGuard, async (req, res) => {
        try {
            const period = req.query.period || "30d";
            const validPeriods = ["7d", "30d", "90d", "1y"];
            if (!validPeriods.includes(period)) {
                return (0, http_server_1.errorResponse)(res, 400, "Invalid period. Use: 7d, 30d, 90d, 1y");
            }
            const data = await useCase.getUserTrend(period);
            (0, http_server_1.successResponse)(res, data);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    router.get("/content", ...adminGuard, async (req, res) => {
        try {
            const data = await useCase.getContentStats();
            (0, http_server_1.successResponse)(res, data);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    router.get("/health", ...adminGuard, async (req, res) => {
        try {
            const data = await useCase.getSystemHealth();
            (0, http_server_1.successResponse)(res, data);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    return router;
}
