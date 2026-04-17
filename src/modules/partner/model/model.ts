/**
 * ==========================================
 * PARTNER PROFILE MODEL
 * ==========================================
 */

export type PartnerProfile = {
  id: string;
  userId: string;
  cinemaName: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string | null;
  phone: string;
  email: string;
  website?: string | null;
  logo?: string | null;
  taxCode: string;
  businessLicense?: string | null;
  businessLicenseFile?: string | null;
  representativeName?: string | null;
  representativeIdNumber?: string | null;
  representativeIdFile?: string | null;
  taxCertificateFile?: string | null;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankCode: string;
  status: "ACTIVE" | "BANNED" | "DELETE";
  approvedAt?: Date | null;
  rejectionReason?: string | null;
  approvedBy?: string | null;
  commissionRate: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * ==========================================
 * MOVIE MODEL
 * ==========================================
 */

export type Movie = {
  id: string;
  partnerId: string;
  title: string;
  description?: string | null;
  genre: string[];
  language: string;
  duration: number;
  releaseDate: Date;
  endDate: Date;
  posterUrl?: string | null;
  trailerUrl?: string | null;
  rating?: string | null;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "ACTIVE" | "INACTIVE";
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * ==========================================
 * SHOWTIME MODEL
 * ==========================================
 */

export type Showtime = {
  id: string;
  movieId: string;
  partnerId: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
  basePrice: number;
  status: "SCHEDULED" | "STARTED" | "ENDED" | "CANCELLED";
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * ==========================================
 * SEAT MODEL & CONSTANTS
 * ==========================================
 */

export enum SeatType {
  STANDARD = "STANDARD",
  VIP = "VIP",
  COUPLE = "COUPLE",
  BLOCKED = "BLOCKED",
}

export enum SeatStatus {
  AVAILABLE = "AVAILABLE",
  LOCKED = "LOCKED",
  BOOKED = "BOOKED",
  MAINTENANCE = "MAINTENANCE",
}

export type SeatPrice = {
  [SeatType.STANDARD]: number;
  [SeatType.VIP]: number;
  [SeatType.COUPLE]: number;
  [SeatType.BLOCKED]: number;
};

export type Seat = {
  id: string;
  showtimeId: string;
  seatNumber: string;
  rowLabel: string;
  columnNumber: number;
  seatType: SeatType;
  status: SeatStatus;
  price: number;
  lockedUntil?: Date | null;
  lockedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * ==========================================
 * TICKET MODEL
 * ==========================================
 */

export enum TicketStatus {
  RESERVED = "RESERVED",
  CONFIRMED = "CONFIRMED",
  USED = "USED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
  PASSED = "PASSED",
}

export type Ticket = {
  id: string;
  userId: string;
  orderId?: string | null;
  showtimeId: string;
  partnerId: string;
  movieId: string;
  seatId: string;
  seatNumber: string;
  purchasePrice: number;
  partnerAmount: number;
  platformFee: number;
  status: TicketStatus;
  qrCode: string;
  purchasedAt: Date;
  usedAt?: Date | null;
  cancelledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * ==========================================
 * TRANSACTION & WALLET MODEL
 * ==========================================
 */

export enum TransactionType {
  TICKET_SALE = "TICKET_SALE",
  COMMISSION_DEDUCTED = "COMMISSION_DEDUCTED",
  WITHDRAWAL = "WITHDRAWAL",
  REFUND = "REFUND",
  BONUS = "BONUS",
  PENALTY = "PENALTY",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export type Transaction = {
  id: string;
  userId?: string | null;
  partnerId?: string | null;
  orderId?: string | null;
  ticketId?: string | null;
  withdrawalId?: string | null;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  paymentMethod?: string | null;
  paymentGatewayRef?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PartnerWallet = {
  id: string;
  partnerId: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  totalRefunded: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * ==========================================
 * WITHDRAWAL MODEL
 * ==========================================
 */

export enum WithdrawalStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export type Withdrawal = {
  id: string;
  partnerId: string;
  amount: number;
  bankAccountNumber: string;
  bankName: string;
  bankCode: string;
  status: WithdrawalStatus;
  transactionReference?: string | null;
  failureReason?: string | null;
  note?: string | null;
  processedAt?: Date | null;
  approvedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * ==========================================
 * CHECK-IN / ATTENDANCE
 * ==========================================
 */

export type CheckIn = {
  id: string;
  ticketId: string;
  partnerId: string;
  showtimeId: string;
  userId: string;
  scannedAt: Date;
  scannedBy: string;
  ipAddress?: string | null;
  deviceInfo?: string | null;
  createdAt: Date;
};

/**
 * ==========================================
 * STATISTICS & ANALYTICS
 * ==========================================
 */

export type DashboardStats = {
  totalRevenue: number;
  ticketsSold: number;
  occupancyRate: number;
  avgSalesPerShowtime: number;
  activeShowtimes: number;
  pendingWithdrawals: number;
  walletBalance: number;
};

export type MovieStats = {
  movieId: string;
  title: string;
  totalTickets: number;
  totalRevenue: number;
  averageOccupancy: number;
  status: string;
};

export type ShowtimeStats = {
  showtimeId: string;
  movieTitle: string;
  startTime: Date;
  totalSeats: number;
  soldSeats: number;
  occupancyRate: number;
  revenue: number;
};

export type RevenueReport = {
  period: string;
  totalRevenue: number;
  ticketsSold: number;
  commissionDeducted: number;
  netRevenue: number;
  movieCount: number;
  showtimeCount: number;
};

/**
 * ==========================================
 * RESPONSE TYPES
 * ==========================================
 */

export type SeatMapResponse = {
  showtimeId: string;
  movieTitle: string;
  startTime: Date;
  totalSeats: number;
  availableSeats: number;
  seats: {
    row: string;
    seatNumber: string;
    status: SeatStatus;
    type: SeatType;
    price: number;
  }[];
};

export type TicketListResponse = {
  items: Ticket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type WithdrawalListResponse = {
  items: Withdrawal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type TransactionListResponse = {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type Services = {
  id: string;
  name: string;
  price: number;
  category: string;
  icon?: string | null;
};

export enum StaffRole {
  OWNER = "OWNER",
  MANAGER = "MANAGER",
  CASHIER = "CASHIER",
  SCANNER = "SCANNER",
  STAFF = "STAFF",
}

export type PartnerStaff = {
  id: string;
  partnerId: string;
  userId: string;
  role: StaffRole;
  createdAt: Date;
};

export interface PartnerRequestRow {
  id: string;
  userId: string;
  cinemaName: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  logo: string | null;
  taxCode: string;
  businessLicense: string;
  businessLicenseFile: string;
  representativeName: string;
  representativeIdNumber: string;
  representativeIdFile: string;
  taxCertificateFile: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankCode: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  approvedPartnerId?: string | null;
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    phone: string | null;
  };
}

export interface PartnerRequest {
  id: string;
  userId: string;
  cinemaName: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  logo: string | null;
  taxCode: string;
  businessLicense: string;
  businessLicenseFile: string;
  representativeName: string;
  representativeIdNumber: string;
  representativeIdFile: string;
  taxCertificateFile: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  approvedPartnerId?: string | null;
  createdAt: Date;
}

export type PartnerRequestUpdateInput = Partial<
  Pick<
    PartnerRequestRow,
    | "cinemaName"
    | "address"
    | "city"
    | "phone"
    | "email"
    | "logo"
    | "taxCode"
    | "businessLicense"
    | "businessLicenseFile"
    | "representativeName"
    | "representativeIdNumber"
    | "representativeIdFile"
    | "taxCertificateFile"
    | "bankAccountName"
    | "bankAccountNumber"
    | "bankName"
  >
>;
