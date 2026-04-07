"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const value_1 = require("../../../share/common/value");
const http_server_1 = require("../../../share/transport/http-server");
const dto_1 = require("../infras/repository/dto");
class TokenService {
    constructor(prisma) {
        this.sessionModel = (0, dto_1.getSessionModel)(prisma);
        this.passwordTokenModel = (0, dto_1.getPasswordTokenModel)(prisma);
        this.emailTokenModel = (0, dto_1.getEmailTokenModel)(prisma);
    }
    async issueAuthSession(user) {
        const tokenData = {
            sub: user.id,
            email: user.email,
        };
        const accessToken = jsonwebtoken_1.default.sign(tokenData, value_1.ENV.JWT_ACCESS_SECRET, {
            expiresIn: value_1.ENV.JWT_ACCESS_EXPIRES,
            algorithm: "HS512",
        });
        const refreshToken = jsonwebtoken_1.default.sign(tokenData, value_1.ENV.JWT_REFRESH_SECRET, {
            expiresIn: value_1.ENV.JWT_REFRESH_EXPIRES,
            algorithm: "HS512",
        });
        await this.sessionModel.create({
            data: {
                userId: user.id,
                refreshToken,
                expiresAt: this.getTokenExpiry(refreshToken),
            },
        });
        return { accessToken, refreshToken };
    }
    async issueActionToken(payload) {
        const { userId, purpose } = payload;
        const rawToken = crypto_1.default.randomBytes(32).toString("hex");
        const hashedToken = this.hashActionToken(rawToken);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        const model = this.getActionTokenModel(purpose);
        await model.deleteMany({ where: { userId } });
        await model.create({ data: { token: hashedToken, userId, expiresAt } });
        return rawToken;
    }
    async verifyActionToken(token, purpose) {
        const model = this.getActionTokenModel(purpose);
        const record = await model.findUnique({
            where: { token: this.hashActionToken(token) },
        });
        if (!record) {
            throw new http_server_1.UnauthorizedError("Invalid token");
        }
        if (record.expiresAt < new Date()) {
            await model.delete({ where: { id: record.id } });
            throw new http_server_1.UnauthorizedError("Token expired");
        }
        await model.delete({ where: { id: record.id } });
        return { userId: record.userId };
    }
    getActionTokenModel(purpose) {
        return purpose === "reset-password"
            ? this.passwordTokenModel
            : this.emailTokenModel;
    }
    hashActionToken(token) {
        return crypto_1.default.createHash("sha256").update(token).digest("hex");
    }
    getTokenExpiry(token) {
        const payload = jsonwebtoken_1.default.decode(token);
        if (payload && typeof payload !== "string" && typeof payload.exp === "number") {
            return new Date(payload.exp * 1000);
        }
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
}
exports.TokenService = TokenService;
