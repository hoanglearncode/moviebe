import { Role, UserStatus } from "@prisma/client";
import { PermissionCode } from "@/share/security/permissions";

/**
 * ==========================================
 * USER PROFILE MODEL
 * ==========================================
 */

export type UserProfile = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  password?: string | null;
  provider: string;
  avatar: string | null;
  phone: string | null;
  bio: string | null;
  location: string | null;
  avatarColor: string | undefined;
  role: Role;
  permissionsOverride?: PermissionCode[];
  status: UserStatus;
  emailVerified: boolean;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Public user profile (safe to return in API responses)
 */
export type PublicUserProfile = Pick<
  UserProfile,
  | "id"
  | "username"
  | "name"
  | "avatar"
  | "bio"
  | "location"
  | "avatarColor"
  | "createdAt"
  | "provider"
  | "permissionsOverride"
>;

/**
 * Own user profile (for authenticated user)
 */
export type OwnUserProfile = PublicUserProfile & {
  email: string;
  phone: string | null;
  emailVerified: boolean;
  role: Role;
  permissionsOverride?: PermissionCode[];
  permissions?: string[];
  provider: string;
  lastLoginAt: Date | null;
  status: UserStatus;
};

/**
 * ==========================================
 * SESSION MODEL
 * ==========================================
 */

export type UserSession = {
  id: string;
  userId: string;
  refreshToken: string;
  deviceId?: string | null;
  deviceName?: string | null;
  deviceType?: string | null; // Mobile, Desktop, Tablet
  ipAddress?: string | null;
  userAgent?: string | null;
  isActive: boolean;
  expiresAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Session response (without sensitive token)
 */
export type SessionResponse = Omit<UserSession, "refreshToken">;

/**
 * ==========================================
 * SETTINGS MODEL
 * ==========================================
 */

export type UserSettings = {
  id: string;
  userId: string;
  notifications: boolean;
  marketingEmails: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  shareHistory: boolean;
  personalizedRecs: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * ==========================================
 * LIST RESPONSES
 * ==========================================
 */

export type SessionListResponse = {
  items: SessionResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type UserListResponse = {
  items: OwnUserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * ==========================================
 * STATISTICS (Optional, for admin dashboard)
 * ==========================================
 */

export type UserBillingTransaction = {
  id: string;
  type: string;
  status: string;
  amount: number;
  paymentMethod: string | null;
  paymentGatewayRef: string | null;
  createdAt: Date;
};

export type UserBillingRecord = {
  orderId: string;
  date: Date;
  description: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode: string | null;
  status: "paid" | "pending" | "failed";
  transactionCount: number;
  ticketCount: number;
  partnerAmount: number;
  platformFee: number;
  transactions: UserBillingTransaction[];
};

export type UserBillingHistoryResponse = {
  items: UserBillingRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type UserBillingSummary = {
  totalOrders: number;
  totalAmount: number;
  totalPaidAmount: number;
  totalRefundedAmount: number;
  totalPendingAmount: number;
  totalTransactions: number;
  totalRefundTransactions: number;
  totalTickets: number;
  totalPartnerAmount: number;
  totalPlatformFee: number;
};

export type UserReviewItem = {
  id: string;
  score: number;
  content: string | null;
  status: string;
  verifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
  movie: {
    id: string;
    title: string;
    posterUrl?: string | null;
  };
};

export type UserReviewListResponse = {
  items: UserReviewItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type UserStatsResponse = {
  total: number;
  active: number;
  inactive: number;
  banned: number;
  pending: number;
  adminCount: number;
  partnerCount: number;
  userCount: number;
};
