"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUserHttpService = exports.UserHttpService = void 0;
const http_server_1 = require("../../../../share/transport/http-server");
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
                limit: this.parseNumberQuery(req.query.limit, 20),
                offset: this.parseNumberQuery(req.query.offset, 0),
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
    async listUsers(req, res) {
        await this.handleRequest(res, async () => {
            const query = {
                page: this.parseNumberQuery(req.query.page, 1),
                limit: this.parseNumberQuery(req.query.limit, 20),
                keyword: this.parseStringQuery(req.query.keyword),
                email: this.parseStringQuery(req.query.email),
                username: this.parseStringQuery(req.query.username),
                role: this.parseStringQuery(req.query.role),
                status: this.parseStringQuery(req.query.status),
                sortBy: this.parseStringQuery(req.query.sortBy) ||
                    "createdAt",
                sortOrder: this.parseStringQuery(req.query.sortOrder) ||
                    "desc",
            };
            return this.adminUserUseCase.listUsers(query);
        });
    }
    async getUser(req, res) {
        await this.handleRequest(res, async () => {
            return this.adminUserUseCase.getUserById(String(req.params.id || ""));
        });
    }
    async createUser(req, res) {
        await this.handleRequest(res, async () => this.adminUserUseCase.createUser(req.body), 201);
    }
    async updateUser(req, res) {
        await this.handleRequest(res, async () => {
            return this.adminUserUseCase.updateUser(String(req.params.id || ""), req.body);
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
    async deleteUser(req, res) {
        await this.handleRequest(res, async () => {
            return this.adminUserUseCase.deleteUser(String(req.params.id || ""));
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
