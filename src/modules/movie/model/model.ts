export type MovieStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "ACTIVE" | "INACTIVE";

export interface PublicShowtime {
  id: string;
  movieId: string;
  partnerId: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
  basePrice: number;
  status: string;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  createdAt: Date;
  updatedAt: Date;
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

export interface PublicSeatInfo {
  id: string;
  showtimeId: string;
  seatNumber: string;
  rowLabel: string;
  columnNumber: number;
  seatType: string;
  status: string;
  price: number;
}

export interface PublicShowtimeSeatMap {
  showtime: PublicShowtime;
  room: { layoutSeat: number[][]; rows: number; seatsPerRow: number } | null;
  seats: PublicSeatInfo[];
}

export interface CastMember {
  id?: string;
  movieId?: string;
  name: string;
  role: string;
  photo?: string | null;
}

export interface Movie {
  id: string;
  partnerId: string;
  title: string;
  description?: string | null;
  genre: string[];
  language: string;
  duration: number;
  releaseDate: Date;
  endDate: Date;
  rating?: string | null;
  status: MovieStatus;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  trailerUrl?: string | null;
  altTitle?: string | null;
  director?: string | null;
  year?: number | null;
  country?: string | null;
  tags: string[];
  cast?: CastMember[];
  allowComments: boolean;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
