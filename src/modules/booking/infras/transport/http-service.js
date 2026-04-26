"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingHttpService = void 0;
const dto_1 = require("../../model/dto");
const http_server_1 = require("../../../../share/transport/http-server");
function getParam(value) {
    return Array.isArray(value) ? value[0] : value;
}
class BookingHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async lockSeats(req, res) {
        try {
            const userId = req.user.id;
            const body = dto_1.LockSeatsDTOSchema.parse(req.body);
            const result = await this.useCase.lockSeats(userId, body);
            (0, http_server_1.successResponse)(res, result, "Seats locked successfully", 201);
        }
        catch (error) {
            this.handleError(error, res);
        }
    }
    async getOrder(req, res) {
        try {
            const userId = req.user.id;
            const orderId = getParam(req.params["orderId"]);
            if (!orderId) {
                (0, http_server_1.errorResponse)(res, 400, "Order ID is required");
                return;
            }
            const order = await this.useCase.getOrder(userId, orderId);
            (0, http_server_1.successResponse)(res, order, "Order retrieved");
        }
        catch (error) {
            this.handleError(error, res);
        }
    }
    async cancelOrder(req, res) {
        try {
            const userId = req.user.id;
            const orderId = getParam(req.params["orderId"]);
            if (!orderId) {
                (0, http_server_1.errorResponse)(res, 400, "Order ID is required");
                return;
            }
            await this.useCase.cancelOrder(userId, orderId);
            (0, http_server_1.successResponse)(res, { orderId }, "Order cancelled");
        }
        catch (error) {
            this.handleError(error, res);
        }
    }
    handleError(error, res) {
        if (error && typeof error === "object" && "status" in error && "message" in error) {
            const e = error;
            res.status(e.status).json({ code: e.code, message: e.message, details: e.details });
            return;
        }
        if (error instanceof Error) {
            if (error.name === "ZodError") {
                res.status(400).json({ message: "Validation error", details: error.errors });
                return;
            }
            console.error("[BookingHttpService]", error);
            res.status(500).json({ message: error.message || "Internal server error" });
            return;
        }
        res.status(500).json({ message: "Internal server error" });
    }
}
exports.BookingHttpService = BookingHttpService;
