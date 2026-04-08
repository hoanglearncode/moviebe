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
  postalCode: string;
  phone: string;
  email: string;
  website?: string | null;
  logo?: string | null;
  taxCode: string;
  businessLicense?: string | null;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankCode: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  approvedAt?: Date | null;
  rejectionReason?: string | null;
  commissionRate: number; // 0.1 = 10%
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
  genre: string;
  language: string;
  duration: number; // minutes
  releaseDate: Date;
  endDate: Date;
  posterUrl?: string | null;
  trailerUrl?: string | null;
  rating?: string | null; // PG, R, NC-17, etc.
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
  cinemaRoomId: string;
  startTime: Date;
  endTime: Date;
  basePrice: number; // giá vé cơ bản
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
  PREMIUM = "PREMIUM",
  ACCESSIBLE = "ACCESSIBLE",
}

export enum SeatStatus {
  AVAILABLE = "AVAILABLE",
  LOCKED = "LOCKED", // đã lock tạm thời
  BOOKED = "BOOKED", // đã đặt/bán
  MAINTENANCE = "MAINTENANCE", // bảo trì
}

export type SeatPrice = {
  [SeatType.STANDARD]: number;
  [SeatType.VIP]: number;
  [SeatType.PREMIUM]: number;
  [SeatType.ACCESSIBLE]: number;
};

export type Seat = {
  id: string;
  showtimeId: string;
  seatNumber: string; // A1, A2, B1, etc.
  seatType: SeatType;
  status: SeatStatus;
  price: number;
  lockedUntil?: Date | null; // đến khi nào thì mở lock
  lockedBy?: string | null; // user ID nếu đang lock
  createdAt: Date;
  updatedAt: Date;
};

/**
 * ==========================================
 * TICKET MODEL
 * ==========================================
 */

export enum TicketStatus {
  RESERVED = "RESERVED", // đã đặt chưa thanh toán
  CONFIRMED = "CONFIRMED", // đã thanh toán
  USED = "USED", // đã xem phim
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export type Ticket = {
  id: string;
  userId: string;
  showtimeId: string;
  partnerId: string;
  movieId: string;
  seatId: string;
  seatNumber: string;
  purchasePrice: number;
  partnerAmount: number; // số tiền partner nhận
  platformFee: number; // platform commission
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
  partnerId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  relatedId?: string | null; // ticket ID, withdrawal ID, etc.
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
  processedAt?: Date | null;
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
  scannedBy: string; // staff/partner ID
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
  occupancyRate: number; // 0-1
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
  period: string; // YYYY-MM
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
