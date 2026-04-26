"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBookingRouter = void 0;
const express_1 = require("express");
const repo_1 = require("./infras/repository/repo");
const index_1 = require("./usecase/index");
const http_service_1 = require("./infras/transport/http-service");
const auth_1 = require("../../share/middleware/auth");
const buildBookingRouter = (prisma) => {
    const repo = new repo_1.BookingRepository(prisma);
    const useCase = new index_1.BookingUseCase(repo);
    const controller = new http_service_1.BookingHttpService(useCase);
    const router = (0, express_1.Router)();
    const guard = [auth_1.authMiddleware, auth_1.requireActiveUser];
    // Lock seats and create an order (requires auth)
    router.post("/lock-seats", ...guard, (req, res) => controller.lockSeats(req, res));
    // Get order details (requires auth + must own the order)
    router.get("/:orderId", ...guard, (req, res) => controller.getOrder(req, res));
    // Cancel order and release seats (requires auth + must own the order)
    router.delete("/:orderId", ...guard, (req, res) => controller.cancelOrder(req, res));
    return router;
};
exports.buildBookingRouter = buildBookingRouter;
