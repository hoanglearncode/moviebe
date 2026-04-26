"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentUseCase = void 0;
class PaymentUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async createPayment(userId, orderId, paymentMethod) {
        return this.repo.createPaymentForOrder(userId, orderId, paymentMethod);
    }
    async getPaymentStatus(userId, orderId) {
        return this.repo.getOrderStatus(userId, orderId);
    }
    async confirmMockPayment(orderId, gatewayRef, status) {
        return this.repo.confirmMockPayment(orderId, gatewayRef, status);
    }
}
exports.PaymentUseCase = PaymentUseCase;
