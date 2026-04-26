"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUserHttpService = void 0;
const http_server_1 = require("../../../../../share/transport/http-server");
class AdminUserHttpService {
    constructor(useCase, schema) {
        this.settingUseCase = useCase;
        this.schema = schema;
    }
    getUserId(req) {
        const userId = req.user?.id;
        if (!userId)
            throw new http_server_1.UnauthorizedError();
        return userId;
    }
    async list(req, res) {
        try {
            const data = await this.settingUseCase.get(this.getUserId(req));
            (0, http_server_1.successResponse)(res, data);
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.status, error.message, error.code, error.details);
        }
    }
    async update(req, res) {
        try {
            const parsed = this.schema.parse(req.body);
            const result = await this.settingUseCase.update(this.getUserId(req), parsed);
            (0, http_server_1.successResponse)(res, result);
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.status, error.message, error.code, error.details);
        }
    }
    async reset(req, res) {
        try {
            const result = await this.settingUseCase.reset(this.getUserId(req));
            (0, http_server_1.successResponse)(res, result);
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.status, error.message, error.code, error.details);
        }
    }
}
exports.AdminUserHttpService = AdminUserHttpService;
