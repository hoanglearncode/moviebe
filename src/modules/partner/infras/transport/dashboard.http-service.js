"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerDashboardHttpService = void 0;
const http_server_1 = require("../../../../share/transport/http-server");
class PartnerDashboardHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async getDashboard(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const stats = await this.useCase.getDashboardStats(partnerId);
            (0, http_server_1.successResponse)(res, stats, "Dashboard stats retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async getTopMovies(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const topMovies = await this.useCase.getTopMovies(partnerId, limit);
            (0, http_server_1.successResponse)(res, topMovies, "Top movies retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async getOccupancy(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
            const stats = await this.useCase.getOccupancyStats(partnerId, startDate, endDate);
            (0, http_server_1.successResponse)(res, stats, "Occupancy stats retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
}
exports.PartnerDashboardHttpService = PartnerDashboardHttpService;
