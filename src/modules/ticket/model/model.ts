export type TicketStatus =
  | "RESERVED"
  | "CONFIRMED"
  | "USED"
  | "CANCELLED"
  | "REFUNDED"
  | "PASSED";

export interface UserTicket {
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
  showtime?: {
    id: string;
    startTime: Date;
    endTime: Date;
    movie?: {
      id: string;
      title: string;
      posterUrl?: string | null;
      genre: string[];
      duration: number;
      rating?: string | null;
      language: string;
    } | null;
    partner?: {
      cinemaName: string;
      city: string;
      address: string;
      phone: string;
    } | null;
  } | null;
  seat?: {
    seatNumber: string;
    rowLabel: string;
    columnNumber: number;
    seatType: string;
  } | null;
  checkIn?: {
    scannedAt: Date;
    scannedBy: string;
  } | null;
}

export interface TicketListResult {
  items: UserTicket[];
  total: number;
  page: number;
  limit: number;
}
