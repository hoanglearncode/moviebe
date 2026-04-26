"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieManagementHttpService = void 0;
const http_server_1 = require("../../../../share/transport/http-server");
const helper_1 = require("../../../admin-audit-logs/helper");
class MovieManagementHttpService {
    constructor(useCase, prisma) {
        this.useCase = useCase;
        this.prisma = prisma;
    }
    async createMovie(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const data = req.body;
            const result = await this.useCase.createMovie(partnerId, data);
            (0, http_server_1.successResponse)(res, result, "Movie created successfully", 201);
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async getMovies(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const query = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                status: req.query.status,
                keyword: req.query.keyword,
                sortBy: req.query.sortBy || "createdAt",
                sortOrder: req.query.sortOrder || "desc",
            };
            const result = await this.useCase.getMovies(partnerId, query);
            (0, http_server_1.successResponse)(res, result, "Movies retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async getMovieDetail(req, res) {
        try {
            const partnerId = req.partnerId;
            const { movieId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const movie = await this.useCase.getMovieDetail(partnerId, String(movieId));
            (0, http_server_1.successResponse)(res, movie, "Movie retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 404, error.message, error.code);
        }
    }
    async updateMovie(req, res) {
        try {
            const partnerId = req.partnerId;
            const { movieId } = req.params;
            const data = req.body;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const updated = await this.useCase.updateMovie(partnerId, String(movieId), data);
            (0, http_server_1.successResponse)(res, updated, "Movie updated successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async deleteMovie(req, res) {
        try {
            const partnerId = req.partnerId;
            const { movieId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const result = await this.useCase.deleteMovie(partnerId, String(movieId));
            (0, http_server_1.successResponse)(res, result, "Movie deleted successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async submitMovie(req, res) {
        try {
            const partnerId = req.partnerId;
            const { movieId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const result = await this.useCase.submitMovieForApproval(partnerId, String(movieId));
            (0, http_server_1.successResponse)(res, result, "Movie submitted for approval");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    // ── Admin handlers ──────────────────────────────────────────────────────────
    async adminListMovies(req, res) {
        try {
            const query = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                status: req.query.status,
                keyword: req.query.keyword,
                sortBy: req.query.sortBy || "createdAt",
                sortOrder: req.query.sortOrder || "desc",
            };
            const result = await this.useCase.adminListMovies(query);
            (0, http_server_1.successResponse)(res, result, "Movies retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async adminGetMovieStats(req, res) {
        try {
            const stats = await this.useCase.adminGetMovieStats();
            (0, http_server_1.successResponse)(res, stats, "Movie stats retrieved");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, 500, error.message, error.code);
        }
    }
    async adminApproveMovie(req, res) {
        try {
            const { movieId } = req.params;
            const { note = "" } = req.body;
            const result = await this.useCase.adminApproveMovie(String(movieId), note);
            if (this.prisma) {
                await (0, helper_1.writeAuditLog)(this.prisma, req, {
                    action: "approve_movie",
                    description: `Approved movie ${movieId}`,
                    category: "movie",
                    severity: "medium",
                    targetType: "movie",
                    targetId: String(movieId),
                    targetLabel: String(result?.title ?? movieId),
                    meta: { note },
                });
            }
            (0, http_server_1.successResponse)(res, result, "Movie approved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async adminRejectMovie(req, res) {
        try {
            const { movieId } = req.params;
            const { reason, note } = req.body;
            if (!reason || !note) {
                return (0, http_server_1.errorResponse)(res, 400, "reason and note are required");
            }
            const result = await this.useCase.adminRejectMovie(String(movieId), reason, note);
            if (this.prisma) {
                await (0, helper_1.writeAuditLog)(this.prisma, req, {
                    action: "reject_movie",
                    description: `Rejected movie ${movieId}`,
                    category: "movie",
                    severity: "medium",
                    targetType: "movie",
                    targetId: String(movieId),
                    targetLabel: String(result?.title ?? movieId),
                    meta: { reason, note },
                });
            }
            (0, http_server_1.successResponse)(res, result, "Movie rejected successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
}
exports.MovieManagementHttpService = MovieManagementHttpService;
