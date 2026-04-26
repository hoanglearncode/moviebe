"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketAccessDeniedError = exports.TicketNotFoundError = void 0;
const http_server_1 = require("../../../share/transport/http-server");
const error_code_1 = require("../../../share/model/error-code");
class TicketNotFoundError extends http_server_1.AppError {
    constructor() {
        super("Ticket not found", error_code_1.ErrorCode.NOT_FOUND, 404);
        this.name = "TicketNotFoundError";
    }
}
exports.TicketNotFoundError = TicketNotFoundError;
class TicketAccessDeniedError extends http_server_1.AppError {
    constructor() {
        super("Access denied to this ticket", error_code_1.ErrorCode.UNAUTHORIZED, 403);
        this.name = "TicketAccessDeniedError";
    }
}
exports.TicketAccessDeniedError = TicketAccessDeniedError;
