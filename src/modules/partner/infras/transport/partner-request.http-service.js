"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerRequestHttpService = void 0;
const logger_1 = require("../../../system/log/logger");
const http_server_1 = require("../../../../share/transport/http-server");
const dto_1 = require("../../model/dto");
const helper_1 = require("../../../admin-audit-logs/helper");
class PartnerRequestHttpService {
    constructor(requestUseCase, prisma) {
        this.requestUseCase = requestUseCase;
        this.prisma = prisma;
    }
    handleError(res, error, fallbackStatus = 500) {
        if (error instanceof http_server_1.AppError) {
            (0, http_server_1.errorResponse)(res, error.status, error.message, String(error.code), error.details);
            return;
        }
        const fallbackError = error;
        (0, http_server_1.errorResponse)(res, fallbackError.status ?? fallbackError.statusCode ?? fallbackStatus, fallbackError.message ?? "Internal server error", fallbackError.code ? String(fallbackError.code) : undefined, fallbackError.details);
    }
    async submit(req, res) {
        try {
            const userId = req.user?.id;
            const data = req.body;
            const insert = await this.requestUseCase.submit(userId, data);
            (0, http_server_1.successResponse)(res, insert, "Partner request submitted successfully", 201);
        }
        catch (error) {
            logger_1.logger.error("[PartnerRequest] submit error", { error: error.message });
            this.handleError(res, error, 500);
        }
    }
    async editSubmit(req, res) {
        try {
            const userId = req.user?.id;
            const data = req.body;
            const insert = await this.requestUseCase.editSubmit(userId, data);
            (0, http_server_1.successResponse)(res, insert, "Partner request updated successfully");
        }
        catch (error) {
            logger_1.logger.error("[PartnerRequest] edit submit error", { error: error.message });
            this.handleError(res, error, 500);
        }
    }
    async getMyRequest(req, res) {
        try {
            const userId = req.user?.id;
            const insert = await this.requestUseCase.getMyRequest(userId);
            (0, http_server_1.successResponse)(res, insert, "Partner request status");
        }
        catch (error) {
            this.handleError(res, error, 500);
        }
    }
    async adminListRequests(req, res) {
        try {
            const cound = dto_1.RequestCondDTOSchema.parse(req.query);
            const result = await this.requestUseCase.adminListRequests(cound);
            (0, http_server_1.successResponse)(res, result.data, "Partner request list", 200, result.paging);
        }
        catch (error) {
            this.handleError(res, error, 500);
        }
    }
    async stats(req, res) {
        try {
            const insert = await this.requestUseCase.getStats();
            (0, http_server_1.successResponse)(res, insert, "Partner request list");
        }
        catch (error) {
            this.handleError(res, error, 500);
        }
    }
    async adminGetRequest(req, res) {
        try {
            const id = req.params.id;
            const insert = await this.requestUseCase.adminGetRequest(id);
            (0, http_server_1.successResponse)(res, insert, "Partner request detail");
        }
        catch (error) {
            this.handleError(res, error, 500);
        }
    }
    async adminApprove(req, res) {
        try {
            const id = req.params.id;
            const insert = await this.requestUseCase.adminApprove(id);
            if (this.prisma) {
                await (0, helper_1.writeAuditLog)(this.prisma, req, {
                    action: "approve_partner_request",
                    description: `Approved partner request ${id}`,
                    category: "partner",
                    severity: "high",
                    targetType: "partner_request",
                    targetId: id,
                    targetLabel: String(insert?.cinemaName ?? id),
                    meta: {
                        status: insert?.status,
                        approvedPartnerId: insert?.approvedPartnerId,
                    },
                });
            }
            (0, http_server_1.successResponse)(res, insert, "Partner request approved");
        }
        catch (error) {
            logger_1.logger.error("[PartnerRequest] approve error", { error: error.message });
            this.handleError(res, error, 500);
        }
    }
    async adminReject(req, res) {
        try {
            const id = req.params.id;
            const reason = req.body.reason;
            const insert = await this.requestUseCase.adminReject(id, reason);
            if (this.prisma) {
                await (0, helper_1.writeAuditLog)(this.prisma, req, {
                    action: "reject_partner_request",
                    description: `Rejected partner request ${id}`,
                    category: "partner",
                    severity: "high",
                    targetType: "partner_request",
                    targetId: id,
                    targetLabel: String(insert?.cinemaName ?? id),
                    meta: {
                        status: insert?.status,
                        reason,
                    },
                });
            }
            (0, http_server_1.successResponse)(res, insert, "Partner request rejected");
        }
        catch (error) {
            logger_1.logger.error("[PartnerRequest] reject error", { error: error.message });
            this.handleError(res, error, 500);
        }
    }
    async adminReset(req, res) {
        try {
            const id = req.params.id;
            const insert = await this.requestUseCase.adminReset(id);
            (0, http_server_1.successResponse)(res, insert, "Partner request reset to pending");
        }
        catch (error) {
            logger_1.logger.error("[PartnerRequest] reset error", { error: error.message });
            this.handleError(res, error, 500);
        }
    }
}
exports.PartnerRequestHttpService = PartnerRequestHttpService;
