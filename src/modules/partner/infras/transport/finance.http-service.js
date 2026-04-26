"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerFinanceHttpService = void 0;
const http_server_1 = require("../../../../share/transport/http-server");
class PartnerFinanceHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async getWallet(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const wallet = await this.useCase.getWallet(partnerId);
            (0, http_server_1.successResponse)(res, wallet, "Wallet retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async getTransactions(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const transactions = await this.useCase.getTransactions(partnerId);
            (0, http_server_1.successResponse)(res, transactions, "Transactions retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async getRevenue(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const query = {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                groupBy: req.query.groupBy || "DAY",
            };
            const revenue = await this.useCase.getRevenue(partnerId, query);
            (0, http_server_1.successResponse)(res, revenue, "Revenue retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async createWithdrawal(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const data = req.body;
            const result = await this.useCase.createWithdrawal(partnerId, data);
            (0, http_server_1.successResponse)(res, result, "Withdrawal created successfully", 201);
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async getWithdrawals(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const query = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                status: req.query.status,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            };
            const result = await this.useCase.getWithdrawals(partnerId, query);
            (0, http_server_1.successResponse)(res, result, "Withdrawals retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async getWithdrawalDetail(req, res) {
        try {
            const partnerId = req.partnerId;
            const { withdrawalId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const withdrawal = await this.useCase.getWithdrawalDetail(partnerId, String(withdrawalId));
            (0, http_server_1.successResponse)(res, withdrawal, "Withdrawal retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 404, error.message, error.code);
        }
    }
}
exports.PartnerFinanceHttpService = PartnerFinanceHttpService;
