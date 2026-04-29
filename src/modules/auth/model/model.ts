export type AuthActionTokenPurpose = "verify-email" | "reset-password";

import { UserStatus, Role } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  password: string | null;
  provider: string;
  avatar: string | null;
  phone: string | null;
  bio: string | null;
  location: string | null;
  role: Role;
  lastLoginAt: Date | null;
  avatarColor: string | null;
  emailVerified: boolean;
  mustChangePassword: boolean;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthPublicUser = Pick<
  AuthUser,
  | "id"
  | "email"
  | "username"
  | "name"
  | "mustChangePassword"
  | "emailVerified"
  | "role"
  | "status"
  | "avatar"
  | "avatarColor"
>;

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = AuthSession & {
  user: AuthPublicUser;
};

export type AuthSocialProfile = {
  email: string;
  name?: string | null;
  avatar?: string | null;
  emailVerified: boolean;
  provider: "google" | "facebook";
};
