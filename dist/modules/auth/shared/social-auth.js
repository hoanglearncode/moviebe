"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialAuthService = void 0;
const google_auth_library_1 = require("google-auth-library");
const value_1 = require("../../../share/common/value");
const http_server_1 = require("../../../share/transport/http-server");
const error_code_1 = require("../../../share/model/error-code");
class SocialAuthService {
    constructor() {
        this.googleClient = new google_auth_library_1.OAuth2Client(value_1.ENV.GOOGLE_CLIENT_ID);
    }
    async verifyGoogleCredential(credential) {
        if (!value_1.ENV.GOOGLE_CLIENT_ID) {
            throw new http_server_1.ValidationError("GOOGLE_CLIENT_ID is not configured", undefined, error_code_1.ErrorCode.VALIDATION);
        }
        const ticket = await this.googleClient.verifyIdToken({
            idToken: credential,
            audience: value_1.ENV.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload?.email) {
            throw new http_server_1.UnauthorizedError("Google account does not provide email", error_code_1.ErrorCode.SOCIAL_GOOGLE_NO_EMAIL);
        }
        return {
            email: payload.email.toLowerCase(),
            name: payload.name ?? null,
            avatar: payload.picture ?? null,
            emailVerified: payload.email_verified ?? true,
            provider: "google",
        };
    }
    async getGoogleProfile(accessToken) {
        const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) {
            throw new http_server_1.UnauthorizedError("Invalid Google access token", error_code_1.ErrorCode.SOCIAL_TOKEN_INVALID);
        }
        const profile = (await response.json());
        if (!profile.email) {
            throw new http_server_1.UnauthorizedError("Google account does not provide email", error_code_1.ErrorCode.SOCIAL_GOOGLE_NO_EMAIL);
        }
        return {
            email: profile.email.toLowerCase(),
            name: profile.name ?? null,
            avatar: profile.picture ?? null,
            emailVerified: profile.email_verified ?? true,
            provider: "google",
        };
    }
    async getFacebookProfile(accessToken) {
        const url = new URL("https://graph.facebook.com/me");
        url.searchParams.set("fields", "id,name,email,picture.type(large)");
        url.searchParams.set("access_token", accessToken);
        const response = await fetch(url);
        if (!response.ok) {
            throw new http_server_1.UnauthorizedError("Invalid Facebook access token", error_code_1.ErrorCode.SOCIAL_TOKEN_INVALID);
        }
        const profile = (await response.json());
        if (!profile.email) {
            throw new http_server_1.UnauthorizedError("Facebook account does not provide email", error_code_1.ErrorCode.SOCIAL_FACEBOOK_NO_EMAIL);
        }
        return {
            email: profile.email.toLowerCase(),
            name: profile.name ?? null,
            avatar: profile.picture?.data?.url ?? null,
            emailVerified: true,
            provider: "facebook",
        };
    }
}
exports.SocialAuthService = SocialAuthService;
