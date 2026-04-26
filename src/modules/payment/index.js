"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaymentRouter = void 0;
const express_1 = require("express");
const repo_1 = require("./infras/repository/repo");
const index_1 = require("./usecase/index");
const http_service_1 = require("./infras/transport/http-service");
const auth_1 = require("../../share/middleware/auth");
const buildPaymentRouter = (prisma) => {
    const repo = new repo_1.PaymentRepository(prisma);
    const useCase = new index_1.PaymentUseCase(repo);
    const controller = new http_service_1.PaymentHttpService(useCase);
    const router = (0, express_1.Router)();
    const guard = [auth_1.authMiddleware, auth_1.requireActiveUser];
    // Initiate payment for an order (requires auth)
    router.post("/create", ...guard, (req, res) => controller.createPayment(req, res));
    // Get payment / order status (requires auth)
    router.get("/status/:orderId", ...guard, (req, res) => controller.getPaymentStatus(req, res));
    // Confirm mock payment (called from mock gateway callback, requires auth)
    router.post("/confirm-mock", ...guard, (req, res) => controller.confirmMockPayment(req, res));
    return router;
};
exports.buildPaymentRouter = buildPaymentRouter;
