"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeatManagementHttpService = void 0;
const http_server_1 = require("../../../../share/transport/http-server");
class SeatManagementHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async getSeats(req, res) {
        try {
            const partnerId = req.partnerId;
            const { showtimeId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const seats = await this.useCase.getSeats(partnerId, String(showtimeId));
            (0, http_server_1.successResponse)(res, seats, "Seats retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async updateSeat(req, res) {
        try {
            const partnerId = req.partnerId;
            const { seatId } = req.params;
            const data = req.body;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const updated = await this.useCase.updateSeat(partnerId, String(seatId), data);
            (0, http_server_1.successResponse)(res, updated, "Seat updated successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async getSeatMap(req, res) {
        try {
            const partnerId = req.partnerId;
            const { showtimeId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const seatMap = await this.useCase.getSeatMap(partnerId, String(showtimeId));
            (0, http_server_1.successResponse)(res, seatMap, "Seat map retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
}
exports.SeatManagementHttpService = SeatManagementHttpService;
