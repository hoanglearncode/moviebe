"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthHttpService = void 0;
class AuthHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async register(req, res) {
        await this.handle(res, 201, () => this.useCase.register(req.body));
    }
    async login(req, res) {
        await this.handle(res, 200, () => this.useCase.login(req.body));
    }
    async verifyEmail(req, res) {
        await this.handle(res, 200, () => this.useCase.verifyEmail(req.body));
    }
    async resendVerification(req, res) {
        await this.handle(res, 200, () => this.useCase.resendVerification(req.body));
    }
    async forgotPassword(req, res) {
        await this.handle(res, 200, () => this.useCase.forgotPassword(req.body));
    }
    async changePassword(req, res) {
        await this.handle(res, 200, () => this.useCase.changePassword(req.body));
    }
    async handle(res, statusCode, action) {
        try {
            const data = await action();
            res.status(statusCode).json({ data });
        }
        catch (error) {
            res.status(400).json({
                message: error.message,
            });
        }
    }
}
exports.AuthHttpService = AuthHttpService;
