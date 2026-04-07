"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthHttpService = void 0;
const http_server_1 = require("../../../../share/transport/http-server");
class AuthHttpService extends http_server_1.BaseHttpService {
    constructor(useCase) {
        super(useCase);
        this.authUseCase = useCase;
    }
    async register(req, res) {
        await this.handleRequest(res, () => this.authUseCase.register(req.body), 201);
    }
    async login(req, res) {
        await this.handleRequest(res, () => this.authUseCase.login(req.body));
    }
    async refreshToken(req, res) {
        await this.handleRequest(res, () => this.authUseCase.refreshToken(req.body));
    }
    async loginGoogle(req, res) {
        await this.handleRequest(res, () => this.authUseCase.loginGoogle(req.body));
    }
    async loginGoogleTokenCallback(req, res) {
        await this.handleRequest(res, () => this.authUseCase.loginGoogleTokenCallback(req.body));
    }
    async loginFacebook(req, res) {
        await this.handleRequest(res, () => this.authUseCase.loginFacebook(req.body));
    }
    async verifyEmail(req, res) {
        await this.handleRequest(res, () => this.authUseCase.verifyEmail(req.body));
    }
    async resendVerification(req, res) {
        await this.handleRequest(res, () => this.authUseCase.resendVerification(req.body));
    }
    async forgotPassword(req, res) {
        await this.handleRequest(res, () => this.authUseCase.forgotPassword(req.body));
    }
    async changePassword(req, res) {
        await this.handleRequest(res, () => this.authUseCase.changePassword(req.body));
    }
}
exports.AuthHttpService = AuthHttpService;
