import { BaseHttpService } from "@/share/transport/http-server";
export class AuthHttpService extends BaseHttpService {
    constructor(useCase) {
        super(useCase);
        this.authUseCase = useCase;
    }
    async register(req, res) {
        await this.handleRequest(res, () => this.authUseCase.register(req.body), 201);
    }
    async login(req, res) {
        await this.handleRequest(res, () => this.authUseCase.login(req.body, {
            userAgent: req.headers["user-agent"],
            ipAddress: req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress,
        }));
    }
    async refreshToken(req, res) {
        await this.handleRequest(res, () => this.authUseCase.refreshToken(req.body));
    }
    async loginGoogle(req, res) {
        await this.handleRequest(res, () => this.authUseCase.loginGoogle(req.body, {
            userAgent: req.headers["user-agent"],
            ipAddress: req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress,
        }));
    }
    async loginGoogleTokenCallback(req, res) {
        await this.handleRequest(res, () => this.authUseCase.loginGoogleTokenCallback(req.body, {
            userAgent: req.headers["user-agent"],
            ipAddress: req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress,
        }));
    }
    async loginFacebook(req, res) {
        await this.handleRequest(res, () => this.authUseCase.loginFacebook(req.body, {
            userAgent: req.headers["user-agent"],
            ipAddress: req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress,
        }));
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
