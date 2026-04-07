export type AuthActionTokenPurpose = "verify-email" | "reset-password";

import { UserStatus } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  username?: string | null;
  name?: string | null;
  password?: string | null;
  emailVerified: boolean;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthPublicUser = Pick<AuthUser, "id" | "email" | "username" | "name">;

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
};
