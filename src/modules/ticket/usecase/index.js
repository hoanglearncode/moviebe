"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserTicketUseCase = void 0;
const error_1 = require("../model/error");
class UserTicketUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async getMyTickets(userId, query) {
        return this.repo.findByUserId(userId, query);
    }
    async getTicketDetail(userId, ticketId) {
        const ticket = await this.repo.findByIdAndUserId(ticketId, userId);
        if (!ticket)
            throw new error_1.TicketNotFoundError();
        return ticket;
    }
}
exports.UserTicketUseCase = UserTicketUseCase;
