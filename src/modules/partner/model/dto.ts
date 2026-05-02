import z from "zod";

/**
 * ==========================================
 * PARTNER PROFILE DTOs
 * ==========================================
 */

export const SubmitPartnerRequestSchema = z.object({
  cinemaName: z.string().trim().min(1, "Cinema name is required").max(255),
  address: z.string().trim().min(5, "Address is required"),
  city: z.string().trim().min(1, "City is required"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{9,}$/, "Invalid phone number"),
  email: z.string().trim().email("Invalid email"),
  logo: z.string().trim().url().optional(),
  taxCode: z.string().trim().min(1, "Tax code is required"),
  businessLicense: z.string().trim().min(1, "Business license is required"),
  businessLicenseFile: z.string().trim().url("Invalid license file URL"),
  representativeName: z.string().trim().min(1, "Representative name is required"),
  representativeIdNumber: z.string().trim().min(9, "Invalid ID number"),
  representativeIdFile: z.string().trim().url("Invalid ID file URL"),
  taxCertificateFile: z.string().trim().url("Invalid tax certificate file URL"),
  bankAccountName: z.string().trim().min(1, "Bank account name is required"),
  bankAccountNumber: z.string().trim().min(10, "Invalid bank account number"),
  bankName: z.string().trim().min(1, "Bank name is required"),
});

export const UpdatePartnerPayloadDTO = z.object({
  cinemaName: z.string().trim().min(1).max(255).optional(),
  address: z.string().trim().min(5).optional(),
  city: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  postalCode: z.string().trim().optional().nullable(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{9,}$/)
    .optional(),
  email: z.string().trim().email().optional(),
  website: z.string().trim().url().optional().nullable(),
  logo: z.string().trim().url().optional().nullable(),
  taxCode: z.string().trim().min(1).optional(),
  businessLicense: z.string().trim().min(1).optional(),
  businessLicenseFile: z.string().trim().url().optional(),
  representativeName: z.string().trim().min(1).optional(),
  representativeIdNumber: z.string().trim().min(9).optional(),
  representativeIdFile: z.string().trim().url().optional(),
  taxCertificateFile: z.string().trim().url().optional(),
  bankAccountName: z.string().trim().min(1).optional(),
  bankAccountNumber: z.string().trim().min(10).optional(),
  bankName: z.string().trim().min(1).optional(),
  bankCode: z.string().trim().min(1).optional(),
});
/**
 * ==========================================
 * MOVIE DTOs
 * ==========================================
 */

const CastMemberDTOSchema = z.object({
  name: z.string().trim().min(1),
  role: z.string().trim().optional(),
  photo: z.string().trim().url().optional(),
});

const ShowtimePlanDTOSchema = z.object({
  date: z.string().min(1, "Date required"), // "YYYY-MM-DD"
  time: z.string().min(1, "Time required"), // "HH:mm"
  roomId: z.string().min(1, "Room ID required"),
  prices: z.object({
    standard: z.number().min(1000).optional(),
    vip: z.number().min(1000).optional(),
    premium: z.number().min(1000).optional(),
    couple: z.number().min(1000).optional(),
  }),
});

export const CreateMoviePayloadDTO = z.object({
  // Core
  title: z.string().trim().min(1, "Title required").max(255),
  description: z.string().trim().optional(),
  genre: z.array(z.string().trim().min(1, "Genre required")).min(1, "Genre required"),
  language: z.string().trim().min(1, "Language required").default("en"),
  duration: z.number().int().min(30, "Duration at least 30 minutes"),
  releaseDate: z.string().datetime("Invalid date"),
  endDate: z.string().datetime("Invalid date"),
  rating: z.string().trim().optional(),

  // Media
  posterUrl: z.string().trim().url("Invalid poster URL").optional(),
  backdropUrl: z.string().trim().url("Invalid backdrop URL").optional(),
  trailerUrl: z.string().trim().url("Invalid trailer URL").optional(),

  // Extended metadata
  altTitle: z.string().trim().optional(),
  director: z.string().trim().optional(),
  year: z.number().int().optional(),
  country: z.string().trim().optional(),
  tags: z.array(z.string().trim()).optional(),
  cast: z.array(CastMemberDTOSchema).optional(),

  // Showtime plans (created atomically alongside the movie)
  showtimes: z.array(ShowtimePlanDTOSchema).optional(),

  // Settings
  allowComments: z.boolean().optional(),
});

export const UpdateMoviePayloadDTO = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().nullable().optional(),
  genre: z.array(z.string().trim().min(1)).min(1).optional(),
  language: z.string().trim().min(1).optional(),
  duration: z.number().int().min(30).optional(),
  releaseDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  posterUrl: z.string().trim().url().optional(),
  trailerUrl: z.string().trim().url().optional(),
  rating: z.string().trim().optional(),
});

/**
 * ==========================================
 * SHOWTIME & SEAT DTOs
 * ==========================================
 */

export const CreateShowtimePayloadDTO = z.object({
  movieId: z.string().min(1, "Movie ID required"),
  roomId: z.string().min(1, "Room ID required"),
  startTime: z.string().datetime("Invalid datetime"),
  basePrice: z.number().min(1000, "Price too low"),
  totalSeats: z.number().int().min(1, "At least 1 seat"),
});

export const UpdateShowtimePayloadDTO = z.object({
  basePrice: z.number().min(1000).optional(),
  status: z.enum(["SCHEDULED", "STARTED", "ENDED", "CANCELLED"]).optional(),
});

/**
 * ==========================================
 * ROOM DTOs
 * ==========================================
 */

export const CreateRoomPayloadDTO = z.object({
  name: z.string().trim().min(1, "Room name required").max(100),
  type: z.enum(["TWO_D", "THREE_D", "IMAX", "VIP", "FOUR_DX"]),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).default("ACTIVE"),
  rows: z.number().int().min(1, "At least 1 row"),
  seatsPerRow: z.number().int().min(1, "At least 1 seat per row"),
  tech: z.array(z.string().trim()).default([]),
  screenWidth: z.number().min(1, "Screen width required"),
  screenHeight: z.number().min(1, "Screen height required"),
  screenPos: z.string().min(1, "Screen position required"),
  aspectRatio: z.string().min(1, "Aspect ratio required"),
  entrancePos: z.string().min(1, "Entrance position required"),
  aislePos: z.string().optional().nullable(),
  layoutSeat: z.array(z.array(z.number())).default([]),
  allowOnlineBooking: z.boolean().default(true),
  allowSeatSelection: z.boolean().default(true),
  maxBookingDays: z.number().int().min(1).default(14),
  maxSeatsPerTransaction: z.number().int().min(1).default(10),
  buildYear: z.number().int().optional().nullable(),
  lastRenovated: z.number().int().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  internalNotes: z.string().trim().optional().nullable(),
  services: z.array(z.number().int()).default([]),
});

export const UpdateRoomPayloadDTO = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  type: z.enum(["TWO_D", "THREE_D", "IMAX", "VIP", "FOUR_DX"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).optional(),
  rows: z.number().int().min(1).optional(),
  seatsPerRow: z.number().int().min(1).optional(),
  tech: z.array(z.string().trim()).optional(),
  screenWidth: z.number().min(1).optional(),
  screenHeight: z.number().min(1).optional(),
  screenPos: z.string().min(1).optional(),
  aspectRatio: z.string().min(1).optional(),
  entrancePos: z.string().min(1).optional(),
  aislePos: z.string().optional().nullable(),
  layoutSeat: z.array(z.array(z.number())).optional(),
  allowOnlineBooking: z.boolean().optional(),
  allowSeatSelection: z.boolean().optional(),
  maxBookingDays: z.number().int().min(1).optional(),
  maxSeatsPerTransaction: z.number().int().min(1).optional(),
  buildYear: z.number().int().optional().nullable(),
  lastRenovated: z.number().int().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  internalNotes: z.string().trim().optional().nullable(),
  services: z.array(z.number().int()).optional(),
});

export const UpdateSeatPayloadDTO = z.object({
  type: z.enum(["STANDARD", "VIP", "COUPLE", "BLOCKED"]).optional(),
  status: z.enum(["AVAILABLE", "LOCKED", "BOOKED", "MAINTENANCE"]).optional(),
  price: z.number().min(1000).optional(),
});

export const LockSeatPayloadDTO = z.object({
  showtimeId: z.string().min(1),
  seatIds: z.array(z.string()).min(1, "Select at least one seat"),
  durationMinutes: z.number().int().min(5).max(30).default(10),
});

export const UnlockSeatPayloadDTO = z.object({
  seatIds: z.array(z.string()).min(1),
});

/**
 * ==========================================
 * TICKET DTOs
 * ==========================================
 */

export const CheckInPayloadDTO = z.object({
  qrCode: z.string().min(1, "QR code required"),
  scannedBy: z.string().min(1, "Scanner ID required"),
  ipAddress: z.string().optional(),
});

/**
 * ==========================================
 * FINANCE DTOs
 * ==========================================
 */

export const CreateWithdrawalPayloadDTO = z.object({
  amount: z.number().min(100000, "Minimum withdrawal 100k VND"),
  bankAccountNumber: z.string().trim().min(10, "Invalid account"),
  bankName: z.string().trim().min(1, "Bank name required"),
  bankCode: z.string().trim().min(1, "Bank code required"),
  note: z.string().trim().optional(),
});

/**
 * ==========================================
 * SERVICE DTOs
 * ==========================================
 */
export const UpdateServicePayloadDTO = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  price: z.coerce.number().min(0, "Price must > 0").optional(),
  category: z.string().trim().min(1, "Category is required").optional(),
  icon: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  roomIds: z.array(z.string().trim().min(1, "Room ID is required")).optional(),
});

export const CreateServicePayloadDTO = z.object({
  name: z.string().trim().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price must > 0"),
  category: z.string().trim().min(1, "Category is required"),
  icon: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  roomIds: z.array(z.string().trim().min(1, "Room ID is required")).default([]),
});

export const ServiceCondDTOSchema = z.object({
  name: z.string().trim().min(2, "name must be at least 2 characters").optional(),
  price: z.coerce.number().min(0, "Price must > 0").optional(),
  category: z.string().trim().min(1, "Category is required").optional(),
  roomId: z.string().trim().min(1, "Room ID is required").optional(),
});
/**
 * ==========================================
 * QUERY DTOs
 * ==========================================
 */

export const ListMoviesQueryPayloadDTO = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "ACTIVE", "INACTIVE"]).optional(),
  keyword: z.string().trim().optional(),
  sortBy: z.enum(["createdAt", "title", "releaseDate"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const ListShowtimesQueryPayloadDTO = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  movieId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["SCHEDULED", "STARTED", "ENDED", "CANCELLED"]).optional(),
  sortBy: z.enum(["startTime", "createdAt"]).default("startTime"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const ListTicketsQueryPayloadDTO = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  showtimeId: z.string().optional(),
  status: z.enum(["RESERVED", "CONFIRMED", "USED", "CANCELLED", "REFUNDED", "PASSED"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const ListWithdrawalsQueryPayloadDTO = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const RevenueQueryPayloadDTO = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(["DAY", "MONTH", "MOVIE"]).default("DAY"),
});

export const RequestCondDTOSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]).optional(),
  search: z.string().optional(),
});

export interface CastMemberDTO {
  name: string;
  role?: string;
  photo?: string;
}

export interface ShowtimePlanDTO {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  roomId: string;
  prices: {
    standard?: number;
    vip?: number;
    premium?: number;
    couple?: number;
  };
}

export interface CreateMovieDTO {
  // Core
  title: string;
  description?: string;
  genre: string[];
  language: string;
  duration: number;
  releaseDate: string;
  endDate: string;
  rating?: string;

  // Media
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;

  // Extended metadata
  altTitle?: string;
  director?: string;
  year?: number;
  country?: string;
  tags?: string[];
  cast?: CastMemberDTO[];

  // Showtime plan (stored as planning data; actual showtimes created post-approval)
  showtimes?: ShowtimePlanDTO[];

  // Settings
  allowComments?: boolean;
}

export type UpdateMovieDTO = Partial<CreateMovieDTO>;

export interface ListMoviesQueryDTO {
  page?: number;
  limit?: number;
  status?: string;
  keyword?: string;
  sortBy?: "createdAt" | "updatedAt" | "title" | "releaseDate" | "status";
  sortOrder?: "asc" | "desc";
}
/**
 * ==========================================
 * TYPE EXPORTS
 * ==========================================
 */
export type RequestCondDTO = z.infer<typeof RequestCondDTOSchema>;
export type RegisterPartnerDTO = z.infer<typeof SubmitPartnerRequestSchema>;
export type SubmitPartnerRequestInput = RegisterPartnerDTO & {
  userId: string;
};
export type UpdatePartnerDTO = z.infer<typeof UpdatePartnerPayloadDTO>;

export type CreateShowtimeDTO = z.infer<typeof CreateShowtimePayloadDTO>;
export type UpdateShowtimeDTO = z.infer<typeof UpdateShowtimePayloadDTO>;
export type UpdateSeatDTO = z.infer<typeof UpdateSeatPayloadDTO>;
export type LockSeatDTO = z.infer<typeof LockSeatPayloadDTO>;
export type UnlockSeatDTO = z.infer<typeof UnlockSeatPayloadDTO>;
export type CheckInDTO = z.infer<typeof CheckInPayloadDTO>;
export type CreateWithdrawalDTO = z.infer<typeof CreateWithdrawalPayloadDTO>;
export type ListShowtimesQueryDTO = z.infer<typeof ListShowtimesQueryPayloadDTO>;
export type ListTicketsQueryDTO = z.infer<typeof ListTicketsQueryPayloadDTO>;
export type ListWithdrawalsQueryDTO = z.infer<typeof ListWithdrawalsQueryPayloadDTO>;
export type RevenueQueryDTO = z.infer<typeof RevenueQueryPayloadDTO>;
export type CreateServiceDTO = z.infer<typeof CreateServicePayloadDTO>;
export type UpdateServiceDTO = z.infer<typeof UpdateServicePayloadDTO>;
export type ServicesCondDTO = z.infer<typeof ServiceCondDTOSchema>;
export type CreateRoomDTO = z.infer<typeof CreateRoomPayloadDTO>;
export type UpdateRoomDTO = z.infer<typeof UpdateRoomPayloadDTO>;
