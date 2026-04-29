export type OrderStatus =
  | "PENDING"
  | "PAYMENT_PROCESSING"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED"
  | "REFUND_REQUESTED"
  | "REFUNDED";

export interface Order {
  id: string;
  userId: string;
  showtimeId: string;
  partnerId: string;
  status: OrderStatus;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode?: string | null;
  idempotencyKey?: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingTicket {
  id: string;
  userId: string;
  orderId: string;
  showtimeId: string;
  partnerId: string;
  movieId: string;
  seatId: string;
  seatNumber: string;
  purchasePrice: number;
  partnerAmount: number;
  platformFee: number;
  status: string;
  qrCode: string;
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShowtimeDetail {
  id: string;
  movieId: string;
  partnerId: string;
  startTime: Date;
  endTime: Date;
  basePrice: number;
  totalSeats: number;
  availableSeats: number;
  status: string;
  movie?: {
    id: string;
    title: string;
    posterUrl?: string | null;
    duration: number;
    genre: string[];
    rating?: string | null;
  } | null;
  partner?: {
    id: string;
    cinemaName: string;
    city: string;
    address: string;
  } | null;
}

export interface OrderTicketDetail {
  id: string;
  seatNumber: string;
  status: string;
  qrCode: string;
  purchasePrice: number;
  seat?: {
    seatNumber: string;
    rowLabel: string;
    seatType: string;
  } | null;
}

export interface OrderWithDetails extends Order {
  showtime?: ShowtimeDetail | null;
  tickets?: OrderTicketDetail[];
}
