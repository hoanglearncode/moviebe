"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUserHttpService = exports.UserHttpService = void 0;
const http_server_1 = require("../../../../share/transport/http-server");
const dto_1 = require("../../model/dto");
class UserHttpService extends http_server_1.BaseHttpService {
    constructor(useCase) {
        super(useCase);
        this.userUseCase = useCase;
    }
    async getProfile(req, res) {
        await this.handleRequest(res, async () => {
            return this.userUseCase.getProfile(this.getAuthenticatedUserId(req));
        });
    }
    async updateProfile(req, res) {
        await this.handleRequest(res, async () => {
            return this.userUseCase.updateProfile(this.getAuthenticatedUserId(req), req.body);
        });
    }
    async deleteAccount(req, res) {
        await this.handleRequest(res, async () => {
            return this.userUseCase.deleteAccount(this.getAuthenticatedUserId(req));
        });
    }
    async changePassword(req, res) {
        await this.handleRequest(res, async () => {
            return this.userUseCase.changePassword(this.getAuthenticatedUserId(req), req.body);
        });
    }
    async getSessions(req, res) {
        await this.handleRequest(res, async () => {
            const query = {
                limit: 1000,
                offset: 1,
                orderBy: req.query.orderBy || "createdAt",
            };
            return this.userUseCase.getSessions(this.getAuthenticatedUserId(req), query);
        });
    }
    async revokeSession(req, res) {
        await this.handleRequest(res, async () => {
            return this.userUseCase.revokeSession(this.getAuthenticatedUserId(req), String(req.params.sessionId || ""));
        });
    }
    async revokeAllSessions(req, res) {
        await this.handleRequest(res, async () => {
            return this.userUseCase.revokeAllSessions(this.getAuthenticatedUserId(req));
        });
    }
    async getSettings(req, res) {
        await this.handleRequest(res, async () => {
            return this.userUseCase.getSettings(this.getAuthenticatedUserId(req));
        });
    }
    async updateSettings(req, res) {
        await this.handleRequest(res, async () => {
            return this.userUseCase.updateSettings(this.getAuthenticatedUserId(req), req.body);
        });
    }
    getAuthenticatedUserId(req) {
        const userId = req.user?.id;
        if (!userId) {
            throw new http_server_1.UnauthorizedError("Unauthorized");
        }
        return userId;
    }
    parseNumberQuery(value, fallback) {
        if (Array.isArray(value)) {
            return this.parseNumberQuery(value[0], fallback);
        }
        if (value === undefined) {
            return fallback;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
}
exports.UserHttpService = UserHttpService;
class AdminUserHttpService extends http_server_1.BaseHttpService {
    constructor(useCase) {
        super(useCase);
        this.adminUserUseCase = useCase;
    }
    async list(req, res) {
        try {
            const cond = dto_1.ListUsersQueryPayloadSchema.parse(req.query);
            const result = await this.adminUserUseCase.listWithMeta(cond);
            res.status(200).json({
                data: result.items,
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
                cond,
                filter: cond,
            });
        }
        catch (error) {
            res.status(400).json({
                message: error.message,
            });
        }
    }
    async getUser(req, res) {
        await this.handleRequest(res, async () => {
            return this.adminUserUseCase.getDetail(String(req.params.id || ""));
        });
    }
    async createUser(req, res) {
        await this.handleRequest(res, async () => this.adminUserUseCase.create(req.body), 201);
    }
    async updateUser(req, res) {
        await this.handleRequest(res, async () => {
            return this.adminUserUseCase.update(String(req.params.id || ""), req.body);
        });
    }
    async changeUserStatus(req, res) {
        await this.handleRequest(res, async () => {
            return this.adminUserUseCase.changeUserStatus(String(req.params.id || ""), req.body);
        });
    }
    async resetUserPassword(req, res) {
        await this.handleRequest(res, async () => {
            return this.adminUserUseCase.resetUserPassword(String(req.params.id || ""), req.body);
        });
    }
    async verifyUserEmail(req, res) {
        await this.handleRequest(res, async () => {
            return this.adminUserUseCase.verifyUserEmail(String(req.params.id || ""));
        });
    }
    async revokeAllUserSessions(req, res) {
        await this.handleRequest(res, async () => {
            return this.adminUserUseCase.revokeAllUserSessions(String(req.params.id || ""));
        });
    }
    /**
     * Seed users endpoint - Bulk create random users
     * POST /admin/users/seed
     * Body: { count: number, batchSize?: number, ... }
     */
    async seedUsers(req, res) {
        try {
            const validatedData = dto_1.SeedUsersPayloadSchema.parse(req.body);
            const result = await this.adminUserUseCase.seedUsers(validatedData);
            res.status(201).json({
                message: `Successfully seeded ${result.totalCreated} users`,
                data: {
                    totalRequested: result.totalRequested,
                    totalCreated: result.totalCreated,
                    totalFailed: result.totalFailed,
                    duration: `${result.duration}ms`,
                    startTime: result.startTime,
                    endTime: result.endTime,
                    errors: result.errors.length > 0 ? result.errors : undefined,
                },
            });
        }
        catch (error) {
            res.status(400).json({
                message: error.message,
            });
        }
    }
    /**
     * Clear seed users endpoint - Delete all seed users
     * DELETE /admin/users/seed
     */
    async clearSeedUsers(req, res) {
        await this.handleRequest(res, async () => {
            const result = await this.adminUserUseCase.clearSeedUsers();
            return {
                message: `Deleted ${result.deletedCount} seed users`,
                data: result,
            };
        });
    }
    /**
     * Get seed statistics endpoint
     * GET /admin/users/seed/stats
     */
    async getSeedStatistics(req, res) {
        await this.handleRequest(res, async () => {
            return await this.adminUserUseCase.getSeedStatistics();
        });
    }
    /**
     * Get user statistics endpoint
     * GET /admin/users/stats
     */
    async getStats(req, res) {
        await this.handleRequest(res, async () => {
            return await this.adminUserUseCase.getStats();
        });
    }
    async deleteUser(req, res) {
        await this.handleRequest(res, async () => {
            return this.adminUserUseCase.delete(String(req.params.id || ""));
        });
    }
    parseNumberQuery(value, fallback) {
        if (Array.isArray(value)) {
            return this.parseNumberQuery(value[0], fallback);
        }
        if (value === undefined) {
            return fallback;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
    parseStringQuery(value) {
        if (Array.isArray(value)) {
            return this.parseStringQuery(value[0]);
        }
        return value === undefined ? undefined : String(value);
    }
}
exports.AdminUserHttpService = AdminUserHttpService;
