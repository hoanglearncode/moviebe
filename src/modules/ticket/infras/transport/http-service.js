"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserTicketHttpService = void 0;
const dto_1 = require("../../model/dto");
const http_server_1 = require("../../../../share/transport/http-server");
function getParam(value) {
    return Array.isArray(value) ? value[0] : value;
}
class UserTicketHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async getMyTickets(req, res) {
        try {
            const userId = req.user.id;
            const query = dto_1.ListTicketsDTOSchema.parse(req.query);
            const result = await this.useCase.getMyTickets(userId, query);
            (0, http_server_1.successResponse)(res, result, "Tickets retrieved");
        }
        catch (error) {
            this.handleError(error, res);
        }
    }
    async getTicketDetail(req, res) {
        try {
            const userId = req.user.id;
            const ticketId = getParam(req.params["ticketId"]);
            if (!ticketId) {
                (0, http_server_1.errorResponse)(res, 400, "Ticket ID is required");
                return;
            }
            const ticket = await this.useCase.getTicketDetail(userId, ticketId);
            (0, http_server_1.successResponse)(res, ticket, "Ticket retrieved");
        }
        catch (error) {
            this.handleError(error, res);
        }
    }
    handleError(error, res) {
        if (error && typeof error === "object" && "status" in error && "message" in error) {
            const e = error;
            res.status(e.status).json({ code: e.code, message: e.message });
            return;
        }
        if (error instanceof Error) {
            if (error.name === "ZodError") {
                res.status(400).json({ message: "Validation error", details: error.errors });
                return;
            }
            res.status(500).json({ message: error.message || "Internal server error" });
            return;
        }
        res.status(500).json({ message: "Internal server error" });
    }
}
exports.UserTicketHttpService = UserTicketHttpService;
