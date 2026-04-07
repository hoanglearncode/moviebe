import jwt from "jsonwebtoken";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

import { ENV } from "../../../share/common/value";
import { ITokenService } from "../interface";
import { AuthActionTokenPurpose, AuthSession, AuthUser } from "../model/model";
import { UnauthorizedError } from "../../../share/transport/http-server";
import {
  getEmailTokenModel,
  getPasswordTokenModel,
  getSessionModel,
} from "../infras/repository/dto";

type ActionTokenModel = {
  create(args: {
    data: {
      token: string;
      userId: string;
      expiresAt: Date;
    };
  }): Promise<unknown>;
  delete(args: { where: { id: string } }): Promise<unknown>;
  deleteMany(args: { where: { userId: string } }): Promise<unknown>;
  findUnique(args: {
    where: { token: string };
  }): Promise<{ id: string; userId: string; expiresAt: Date } | null>;
};

export class TokenService implements ITokenService {
  private readonly sessionModel;
  private readonly passwordTokenModel: ActionTokenModel;
  private readonly emailTokenModel: ActionTokenModel;

  constructor(prisma: PrismaClient) {
    this.sessionModel = getSessionModel(prisma);
    this.passwordTokenModel = getPasswordTokenModel(prisma);
    this.emailTokenModel = getEmailTokenModel(prisma);
  }

  async issueAuthSession(user: AuthUser): Promise<AuthSession> {
    const tokenData = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = jwt.sign(tokenData, ENV.JWT_ACCESS_SECRET, {
      expiresIn: ENV.JWT_ACCESS_EXPIRES as jwt.SignOptions["expiresIn"],
      algorithm: "HS512",
    });

    const refreshToken = jwt.sign(tokenData, ENV.JWT_REFRESH_SECRET, {
      expiresIn: ENV.JWT_REFRESH_EXPIRES as jwt.SignOptions["expiresIn"],
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

  async issueActionToken(payload: {
    userId: string;
    purpose: AuthActionTokenPurpose;
  }): Promise<string> {
    const { userId, purpose } = payload;

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = this.hashActionToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const model = this.getActionTokenModel(purpose);

    await model.deleteMany({ where: { userId } });
    await model.create({ data: { token: hashedToken, userId, expiresAt } });

    return rawToken;
  }

  async verifyActionToken(
    token: string,
    purpose: AuthActionTokenPurpose
  ): Promise<{ userId: string }> {
    const model = this.getActionTokenModel(purpose);
    const record = await model.findUnique({
      where: { token: this.hashActionToken(token) },
    });

    if (!record) {
      throw new UnauthorizedError("Invalid token");
    }

    if (record.expiresAt < new Date()) {
      await model.delete({ where: { id: record.id } });
      throw new UnauthorizedError("Token expired");
    }

    await model.delete({ where: { id: record.id } });
    return { userId: record.userId };
  }

  private getActionTokenModel(purpose: AuthActionTokenPurpose) {
    return purpose === "reset-password"
      ? this.passwordTokenModel
      : this.emailTokenModel;
  }

  private hashActionToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private getTokenExpiry(token: string): Date {
    const payload = jwt.decode(token);

    if (payload && typeof payload !== "string" && typeof payload.exp === "number") {
      return new Date(payload.exp * 1000);
    }

    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
}
