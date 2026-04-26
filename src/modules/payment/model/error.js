"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentAccessDeniedError = exports.OrderNotPendingError = exports.PaymentOrderNotFoundError = void 0;
const http_server_1 = require("../../../share/transport/http-server");
const error_code_1 = require("../../../share/model/error-code");
class PaymentOrderNotFoundError extends http_server_1.AppError {
    constructor() {
        super("Order not found", error_code_1.ErrorCode.NOT_FOUND, 404);
        this.name = "PaymentOrderNotFoundError";
    }
}
exports.PaymentOrderNotFoundError = PaymentOrderNotFoundError;
class OrderNotPendingError extends http_server_1.AppError {
    constructor(status) {
        super(`Order cannot be paid (status: ${status})`, error_code_1.ErrorCode.VALIDATION, 400);
        this.name = "OrderNotPendingError";
    }
}
exports.OrderNotPendingError = OrderNotPendingError;
class PaymentAccessDeniedError extends http_server_1.AppError {
    constructor() {
        super("Access denied to this payment", error_code_1.ErrorCode.UNAUTHORIZED, 403);
        this.name = "PaymentAccessDeniedError";
    }
}
exports.PaymentAccessDeniedError = PaymentAccessDeniedError;
