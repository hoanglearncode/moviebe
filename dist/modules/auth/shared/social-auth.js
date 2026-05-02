import { OAuth2Client } from "google-auth-library";
import { ENV } from "@/share/common/value";
import { UnauthorizedError, ValidationError } from "@/share/transport/http-server";
import { ErrorCode } from "@/share/model/error-code";
export class SocialAuthService {
    constructor() {
        this.googleClient = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);
    }
    async verifyGoogleCredential(credential) {
        if (!ENV.GOOGLE_CLIENT_ID) {
            throw new ValidationError("GOOGLE_CLIENT_ID is not configured", undefined, ErrorCode.VALIDATION);
        }
        const ticket = await this.googleClient.verifyIdToken({
            idToken: credential,
            audience: ENV.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload?.email) {
            throw new UnauthorizedError("Google account does not provide email", ErrorCode.SOCIAL_GOOGLE_NO_EMAIL);
        }
        return {
            email: payload.email.toLowerCase(),
            name: payload.name ?? null,
            avatar: payload.picture ?? null,
            emailVerified: payload.email_verified ?? true,
            provider: "google",
            permissions_override: null,
        };
    }
    async getGoogleProfile(accessToken) {
        const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) {
            throw new UnauthorizedError("Invalid Google access token", ErrorCode.SOCIAL_TOKEN_INVALID);
        }
        const profile = (await response.json());
        if (!profile.email) {
            throw new UnauthorizedError("Google account does not provide email", ErrorCode.SOCIAL_GOOGLE_NO_EMAIL);
        }
        return {
            email: profile.email.toLowerCase(),
            name: profile.name ?? null,
            avatar: profile.picture ?? null,
            emailVerified: profile.email_verified ?? true,
            provider: "google",
            permissions_override: null,
        };
    }
    async getFacebookProfile(accessToken) {
        const url = new URL("https://graph.facebook.com/me");
        url.searchParams.set("fields", "id,name,email,picture.type(large)");
        url.searchParams.set("access_token", accessToken);
        const response = await fetch(url);
        if (!response.ok) {
            throw new UnauthorizedError("Invalid Facebook access token", ErrorCode.SOCIAL_TOKEN_INVALID);
        }
        const profile = (await response.json());
        if (!profile.email) {
            throw new UnauthorizedError("Facebook account does not provide email", ErrorCode.SOCIAL_FACEBOOK_NO_EMAIL);
        }
        return {
            email: profile.email.toLowerCase(),
            name: profile.name ?? null,
            avatar: profile.picture?.data?.url ?? null,
            emailVerified: true,
            provider: "facebook",
            permissions_override: null,
        };
    }
}
