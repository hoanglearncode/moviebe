"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.OrderAlreadyCompletedError = exports.OrderAccessDeniedError = exports.OrderNotFoundError = exports.SeatsNotAvailableError = exports.ShowtimeNotAvailableError = exports.ShowtimeNotFoundError = void 0;
const http_server_1 = require("../../../share/transport/http-server");
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return http_server_1.ValidationError; } });
const error_code_1 = require("../../../share/model/error-code");
class ShowtimeNotFoundError extends http_server_1.AppError {
    constructor() {
        super("Showtime not found", error_code_1.ErrorCode.NOT_FOUND, 404);
        this.name = "ShowtimeNotFoundError";
    }
}
exports.ShowtimeNotFoundError = ShowtimeNotFoundError;
class ShowtimeNotAvailableError extends http_server_1.AppError {
    constructor(message = "Showtime is not available for booking") {
        super(message, error_code_1.ErrorCode.VALIDATION, 400);
        this.name = "ShowtimeNotAvailableError";
    }
}
exports.ShowtimeNotAvailableError = ShowtimeNotAvailableError;
class SeatsNotAvailableError extends http_server_1.AppError {
    constructor(seatNumbers) {
        super(`Seats ${seatNumbers.join(", ")} are not available`, error_code_1.ErrorCode.CONCURRENT_TASK_LOCKED, 409);
        this.name = "SeatsNotAvailableError";
    }
}
exports.SeatsNotAvailableError = SeatsNotAvailableError;
class OrderNotFoundError extends http_server_1.AppError {
    constructor() {
        super("Order not found", error_code_1.ErrorCode.NOT_FOUND, 404);
        this.name = "OrderNotFoundError";
    }
}
exports.OrderNotFoundError = OrderNotFoundError;
class OrderAccessDeniedError extends http_server_1.AppError {
    constructor() {
        super("Access denied to this order", error_code_1.ErrorCode.UNAUTHORIZED, 403);
        this.name = "OrderAccessDeniedError";
    }
}
exports.OrderAccessDeniedError = OrderAccessDeniedError;
class OrderAlreadyCompletedError extends http_server_1.AppError {
    constructor() {
        super("Cannot cancel a completed order", error_code_1.ErrorCode.VALIDATION, 400);
        this.name = "OrderAlreadyCompletedError";
    }
}
exports.OrderAlreadyCompletedError = OrderAlreadyCompletedError;
