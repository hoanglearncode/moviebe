"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketCheckInHttpService = void 0;
const http_server_1 = require("../../../../share/transport/http-server");
class TicketCheckInHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async getTickets(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const query = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                showtimeId: req.query.showtimeId,
                status: req.query.status,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            };
            const result = await this.useCase.getTickets(partnerId, query);
            (0, http_server_1.successResponse)(res, result, "Tickets retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async getTicketDetail(req, res) {
        try {
            const partnerId = req.partnerId;
            const { ticketId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const ticket = await this.useCase.getTicketDetail(partnerId, String(ticketId));
            (0, http_server_1.successResponse)(res, ticket, "Ticket retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 404, error.message, error.code);
        }
    }
    async checkIn(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const data = req.body;
            const result = await this.useCase.checkInTicket(partnerId, data);
            (0, http_server_1.successResponse)(res, result, "Check-in successful");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async getCheckInHistory(req, res) {
        try {
            const partnerId = req.partnerId;
            const { showtimeId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const history = await this.useCase.getCheckInHistory(partnerId, String(showtimeId));
            (0, http_server_1.successResponse)(res, history, "Check-in history retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
}
exports.TicketCheckInHttpService = TicketCheckInHttpService;
