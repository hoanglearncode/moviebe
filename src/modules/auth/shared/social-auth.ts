import { OAuth2Client } from "google-auth-library";
import { ISocialAuthService } from "../interface";
import { AuthSocialProfile } from "../model/model";
import { ENV } from "../../../share/common/value";
import { UnauthorizedError, ValidationError } from "../../../share/transport/http-server";
import { ErrorCode } from "../../../share/model/error-code";

type GoogleUserInfoResponse = {
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
};

type FacebookUserInfoResponse = {
  email?: string;
  name?: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
};

export class SocialAuthService implements ISocialAuthService {
  private readonly googleClient = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);

  async verifyGoogleCredential(credential: string): Promise<AuthSocialProfile> {
    if (!ENV.GOOGLE_CLIENT_ID) {
      throw new ValidationError(
        "GOOGLE_CLIENT_ID is not configured",
        undefined,
        ErrorCode.VALIDATION,
      );
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: ENV.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new UnauthorizedError(
        "Google account does not provide email",
        ErrorCode.SOCIAL_GOOGLE_NO_EMAIL,
      );
    }

    return {
      email: payload.email.toLowerCase(),
      name: payload.name ?? null,
      avatar: payload.picture ?? null,
      emailVerified: payload.email_verified ?? true,
      provider: "google",
    };
  }

  async getGoogleProfile(accessToken: string): Promise<AuthSocialProfile> {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedError("Invalid Google access token", ErrorCode.SOCIAL_TOKEN_INVALID);
    }

    const profile = (await response.json()) as GoogleUserInfoResponse;
    if (!profile.email) {
      throw new UnauthorizedError(
        "Google account does not provide email",
        ErrorCode.SOCIAL_GOOGLE_NO_EMAIL,
      );
    }

    return {
      email: profile.email.toLowerCase(),
      name: profile.name ?? null,
      avatar: profile.picture ?? null,
      emailVerified: profile.email_verified ?? true,
      provider: "google",
    };
  }

  async getFacebookProfile(accessToken: string): Promise<AuthSocialProfile> {
    const url = new URL("https://graph.facebook.com/me");
    url.searchParams.set("fields", "id,name,email,picture.type(large)");
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url);
    if (!response.ok) {
      throw new UnauthorizedError("Invalid Facebook access token", ErrorCode.SOCIAL_TOKEN_INVALID);
    }

    const profile = (await response.json()) as FacebookUserInfoResponse;
    if (!profile.email) {
      throw new UnauthorizedError(
        "Facebook account does not provide email",
        ErrorCode.SOCIAL_FACEBOOK_NO_EMAIL,
      );
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
