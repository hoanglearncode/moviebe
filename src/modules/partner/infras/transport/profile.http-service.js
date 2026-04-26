"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerProfileHttpService = void 0;
const http_server_1 = require("../../../../share/transport/http-server");
class PartnerProfileHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async getProfile(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const profile = await this.useCase.getProfile(partnerId);
            (0, http_server_1.successResponse)(res, profile, "Profile retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async updateProfile(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const data = req.body;
            const updated = await this.useCase.updateProfile(partnerId, data);
            (0, http_server_1.successResponse)(res, updated, "Profile updated successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async getStatus(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const status = await this.useCase.getStatus(partnerId);
            (0, http_server_1.successResponse)(res, status, "Status retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
}
exports.PartnerProfileHttpService = PartnerProfileHttpService;
