"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingUseCase = void 0;
const error_1 = require("../model/error");
class BookingUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async lockSeats(userId, data) {
        return this.repo.lockSeatsAtomic({ userId, ...data });
    }
    async getOrder(userId, orderId) {
        const order = await this.repo.findOrderWithDetails(orderId);
        if (!order)
            throw new error_1.OrderNotFoundError();
        if (order.userId !== userId)
            throw new error_1.OrderAccessDeniedError();
        // Auto-expire if time has passed
        if ((order.status === "PENDING" || order.status === "PAYMENT_PROCESSING") &&
            new Date(order.expiresAt) < new Date()) {
            await this.repo.releaseOrderSeats(orderId);
            await this.repo.updateOrder(orderId, { status: "EXPIRED", updatedAt: new Date() });
            return { ...order, status: "EXPIRED" };
        }
        return order;
    }
    async cancelOrder(userId, orderId) {
        const order = await this.repo.findOrderById(orderId);
        if (!order)
            throw new error_1.OrderNotFoundError();
        if (order.userId !== userId)
            throw new error_1.OrderAccessDeniedError();
        if (order.status === "COMPLETED")
            throw new error_1.OrderAlreadyCompletedError();
        if (order.status === "CANCELLED" || order.status === "EXPIRED")
            return;
        await this.repo.releaseOrderSeats(orderId);
        await this.repo.updateOrder(orderId, { status: "CANCELLED", updatedAt: new Date() });
    }
}
exports.BookingUseCase = BookingUseCase;
