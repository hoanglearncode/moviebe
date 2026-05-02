import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UAParser } from "ua-parser-js";
import { v4 as uuidv4 } from "uuid";
import { ENV } from "@/share/common/value";
import { UnauthorizedError } from "@/share/transport/http-server";
import { ErrorCode } from "@/share/model/error-code";
import { getEmailTokenModel, getPasswordTokenModel, getSessionModel, } from "@/modules/auth/infras/repository/dto";
import { getSystemSettingsService } from "@/modules/admin-manage/admin-system-settings";
export class TokenService {
    constructor(prisma) {
        this.prisma = prisma;
        this.sessionModel = getSessionModel(prisma);
        this.passwordTokenModel = getPasswordTokenModel(prisma);
        this.emailTokenModel = getEmailTokenModel(prisma);
    }
    async issueAuthSession(user, context, options) {
        // Read platform settings — non-fatal, fall back to compile-time defaults.
        let maxDevices = 4;
        let sessionRefreshExpires;
        try {
            const svc = getSystemSettingsService();
            const [maxDevStr, timeoutHoursStr] = await Promise.all([
                svc.get("maxDevicesPerUser"),
                svc.get("sessionTimeoutHours"),
            ]);
            maxDevices = Math.max(1, parseInt(maxDevStr, 10));
            const timeoutHours = Math.max(1, parseInt(timeoutHoursStr, 10));
            sessionRefreshExpires = `${timeoutHours}h`;
        }
        catch {
            // SystemSettingsService not available — use defaults
        }
        // Enforce max-devices limit: revoke the oldest session when the user is at
        // the limit so they aren't locked out on new devices.
        const activeCount = await this.prisma.session.count({
            where: { userId: user.id, isActive: true, expiresAt: { gt: new Date() } },
        });
        if (activeCount >= maxDevices) {
            const oldest = await this.prisma.session.findFirst({
                where: { userId: user.id, isActive: true },
                orderBy: { createdAt: "asc" },
                select: { id: true },
            });
            if (oldest) {
                await this.prisma.session.delete({ where: { id: oldest.id } });
            }
        }
        const session = this.createSessionTokens({
            sub: user.id,
            email: user.email,
            scope: user.role ?? "USER",
            status: user.status,
            remember: options?.remember,
            sessionRefreshExpires,
        });
        const parser = new UAParser(context?.userAgent);
        const ua = parser.getResult();
        const deviceName = `${ua.browser.name || "Unknown"} ${ua.browser.version || ""}`;
        const deviceType = ua.device.type || "desktop";
        await this.sessionModel.create({
            data: {
                userId: user.id,
                refreshToken: session.refreshToken,
                expiresAt: this.getTokenExpiry(session.refreshToken),
                deviceId: uuidv4(),
                deviceName,
                deviceType,
                userAgent: context?.userAgent,
                ipAddress: context?.ipAddress,
            },
        });
        return session;
    }
    async refreshAuthSession(refreshToken) {
        const session = await this.sessionModel.findUnique({
            where: { refreshToken },
        });
        if (!session) {
            throw new UnauthorizedError("Invalid refresh token", ErrorCode.REFRESH_TOKEN_INVALID);
        }
        if (session.expiresAt < new Date()) {
            await this.sessionModel.delete({ where: { refreshToken } });
            throw new UnauthorizedError("Refresh token expired", ErrorCode.REFRESH_TOKEN_EXPIRED);
        }
        const payload = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET, {
            algorithms: ["HS512"],
        });
        if (typeof payload === "string" || !payload.sub || !payload.email) {
            await this.sessionModel.delete({ where: { refreshToken } });
            throw new UnauthorizedError("Invalid refresh token", ErrorCode.REFRESH_TOKEN_INVALID);
        }
        const nextSession = this.createSessionTokens({
            sub: String(payload.sub),
            email: String(payload.email),
            scope: payload.scope ?? "USER",
            status: payload.status ?? "ACTIVE",
        });
        await this.sessionModel.delete({ where: { refreshToken } });
        await this.sessionModel.create({
            data: {
                userId: session.userId,
                refreshToken: nextSession.refreshToken,
                expiresAt: this.getTokenExpiry(nextSession.refreshToken),
                deviceId: session.deviceId ?? undefined,
                deviceName: session.deviceName ?? undefined,
                deviceType: session.deviceType ?? undefined,
                userAgent: session.userAgent ?? undefined,
                ipAddress: session.ipAddress ?? undefined,
                isActive: session.isActive ?? undefined,
            },
        });
        return {
            userId: session.userId,
            accessToken: nextSession.accessToken,
            refreshToken: nextSession.refreshToken,
        };
    }
    async issueActionToken(payload) {
        const { userId, purpose } = payload;
        const rawToken = crypto.randomBytes(32).toString("hex");
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
            throw new UnauthorizedError("Invalid token", ErrorCode.TOKEN_INVALID);
        }
        if (record.expiresAt < new Date()) {
            await model.delete({ where: { id: record.id } });
            throw new UnauthorizedError("Token expired", ErrorCode.TOKEN_EXPIRED);
        }
        await model.delete({ where: { id: record.id } });
        return { userId: record.userId };
    }
    getActionTokenModel(purpose) {
        return purpose === "reset-password" ? this.passwordTokenModel : this.emailTokenModel;
    }
    hashActionToken(token) {
        return crypto.createHash("sha256").update(token).digest("hex");
    }
    createSessionTokens(payload) {
        const normalizedPayload = {
            sub: payload.sub,
            email: payload.email,
            scope: payload.scope ?? "USER",
            status: payload.status ?? "ACTIVE",
        };
        const accessToken = jwt.sign(normalizedPayload, ENV.JWT_ACCESS_SECRET, {
            expiresIn: ENV.JWT_ACCESS_EXPIRES,
            algorithm: "HS512",
        });
        // Priority: remember-me > platform sessionTimeoutHours > ENV default
        const refreshExpiresIn = payload.remember
            ? TokenService.REMEMBER_REFRESH_EXPIRES
            : (payload.sessionRefreshExpires ?? ENV.JWT_REFRESH_EXPIRES);
        const refreshToken = jwt.sign(normalizedPayload, ENV.JWT_REFRESH_SECRET, {
            expiresIn: refreshExpiresIn,
            algorithm: "HS512",
        });
        return { accessToken, refreshToken };
    }
    getTokenExpiry(token) {
        const payload = jwt.decode(token);
        if (payload && typeof payload !== "string" && typeof payload.exp === "number") {
            return new Date(payload.exp * 1000);
        }
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
}
TokenService.REMEMBER_REFRESH_EXPIRES = "30d";
