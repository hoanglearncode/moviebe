"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdminFinanceRouter = buildAdminFinanceRouter;
const express_1 = require("express");
const auth_1 = require("../../share/middleware/auth");
const http_server_1 = require("../../share/transport/http-server");
const usecase_1 = require("./usecase");
const helper_1 = require("../admin-audit-logs/helper");
const adminGuard = [...(0, auth_1.protect)((0, auth_1.requireRole)("ADMIN"))];
function buildAdminFinanceRouter(prisma) {
    const router = (0, express_1.Router)();
    const useCase = new usecase_1.AdminFinanceUseCase(prisma);
    const paramId = (value) => Array.isArray(value) ? value[0] ?? "" : (value ?? "");
    router.get("/summary", ...adminGuard, async (req, res) => {
        try {
            const period = req.query.period || "12m";
            const data = await useCase.getSummary(period);
            (0, http_server_1.successResponse)(res, data);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    router.get("/revenue-trend", ...adminGuard, async (req, res) => {
        try {
            const period = req.query.period || "12m";
            const data = await useCase.getRevenueTrend(period);
            (0, http_server_1.successResponse)(res, data);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    router.get("/transactions", ...adminGuard, async (req, res) => {
        try {
            const data = await useCase.getTransactions({
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                type: req.query.type,
                status: req.query.status,
                partnerId: req.query.partnerId,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            });
            (0, http_server_1.successResponse)(res, data);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    router.get("/withdrawals", ...adminGuard, async (req, res) => {
        try {
            const data = await useCase.getWithdrawals({
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                status: req.query.status,
                partnerId: req.query.partnerId,
            });
            (0, http_server_1.successResponse)(res, data);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    router.patch("/withdrawals/:id/approve", ...adminGuard, async (req, res) => {
        try {
            const withdrawalId = paramId(req.params.id);
            const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
            const data = await useCase.approveWithdrawal(withdrawalId, req.user.id);
            await (0, helper_1.writeAuditLog)(prisma, req, {
                action: "approve_withdrawal",
                description: `Approved withdrawal ${withdrawalId}`,
                category: "finance",
                severity: "high",
                targetType: "withdrawal",
                targetId: withdrawalId,
                targetLabel: withdrawalId,
                meta: {
                    partnerId: withdrawal?.partnerId,
                    amount: withdrawal?.amount,
                    statusTo: "PROCESSING",
                },
            });
            (0, http_server_1.successResponse)(res, data);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 400, err.message);
        }
    });
    router.patch("/withdrawals/:id/complete", ...adminGuard, async (req, res) => {
        try {
            const withdrawalId = paramId(req.params.id);
            const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
            const data = await useCase.completeWithdrawal(withdrawalId, req.body.transactionReference);
            await (0, helper_1.writeAuditLog)(prisma, req, {
                action: "complete_withdrawal",
                description: `Completed withdrawal ${withdrawalId}`,
                category: "finance",
                severity: "high",
                targetType: "withdrawal",
                targetId: withdrawalId,
                targetLabel: withdrawalId,
                meta: {
                    partnerId: withdrawal?.partnerId,
                    amount: withdrawal?.amount,
                    transactionReference: req.body.transactionReference ?? "",
                    statusTo: "COMPLETED",
                },
            });
            (0, http_server_1.successResponse)(res, data);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 400, err.message);
        }
    });
    router.patch("/withdrawals/:id/reject", ...adminGuard, async (req, res) => {
        try {
            const { reason } = req.body;
            if (!reason)
                return (0, http_server_1.errorResponse)(res, 400, "Rejection reason is required");
            const withdrawalId = paramId(req.params.id);
            const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
            const data = await useCase.rejectWithdrawal(withdrawalId, reason);
            await (0, helper_1.writeAuditLog)(prisma, req, {
                action: "reject_withdrawal",
                description: `Rejected withdrawal ${withdrawalId}`,
                category: "finance",
                severity: "high",
                targetType: "withdrawal",
                targetId: withdrawalId,
                targetLabel: withdrawalId,
                meta: {
                    partnerId: withdrawal?.partnerId,
                    amount: withdrawal?.amount,
                    reason,
                    statusTo: "FAILED",
                },
            });
            (0, http_server_1.successResponse)(res, data);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 400, err.message);
        }
    });
    router.get("/plan-distribution", ...adminGuard, async (req, res) => {
        try {
            const data = await useCase.getPlanDistribution();
            (0, http_server_1.successResponse)(res, data);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    return router;
}
