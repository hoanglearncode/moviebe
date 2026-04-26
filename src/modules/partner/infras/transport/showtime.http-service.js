"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowtimeManagementHttpService = void 0;
const http_server_1 = require("../../../../share/transport/http-server");
class ShowtimeManagementHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async createShowtime(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const data = req.body;
            const result = await this.useCase.createShowtime(partnerId, data);
            (0, http_server_1.successResponse)(res, result, "Showtime created successfully", 201);
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async getShowtimes(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const query = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                movieId: req.query.movieId,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                status: req.query.status,
                sortBy: req.query.sortBy || "startTime",
                sortOrder: req.query.sortOrder || "asc",
            };
            const result = await this.useCase.getShowtimes(partnerId, query);
            (0, http_server_1.successResponse)(res, result, "Showtimes retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async getShowtimeDetail(req, res) {
        try {
            const partnerId = req.partnerId;
            const { showtimeId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const showtime = await this.useCase.getShowtimeDetail(partnerId, String(showtimeId));
            (0, http_server_1.successResponse)(res, showtime, "Showtime retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 404, error.message, error.code);
        }
    }
    async updateShowtime(req, res) {
        try {
            const partnerId = req.partnerId;
            const { showtimeId } = req.params;
            const data = req.body;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const updated = await this.useCase.updateShowtime(partnerId, String(showtimeId), data);
            (0, http_server_1.successResponse)(res, updated, "Showtime updated successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async cancelShowtime(req, res) {
        try {
            const partnerId = req.partnerId;
            const { showtimeId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const result = await this.useCase.cancelShowtime(partnerId, String(showtimeId));
            (0, http_server_1.successResponse)(res, result, "Showtime cancelled successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
}
exports.ShowtimeManagementHttpService = ShowtimeManagementHttpService;
