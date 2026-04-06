import { ModelStatus } from "../../../share/model/base-model";

export type AuthActionTokenPurpose = "verify-email" | "reset-password";

export type AuthUser = {
  id: string;
  email: string;
  username?: string | null;
  name?: string | null;
  passwordHash: string;
  isVerified: boolean;
  status: ModelStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthPublicUser = Omit<AuthUser, "passwordHash">;

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
};
