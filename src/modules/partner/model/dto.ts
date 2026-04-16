import z from "zod";

/**
 * ==========================================
 * PARTNER PROFILE DTOs
 * ==========================================
 */

export const RegisterPartnerPayloadDTO = z.object({
  cinemaName: z.string().trim().min(1, "Cinema name is required").max(255),
  address: z.string().trim().min(5, "Address is required"),
  city: z.string().trim().min(1, "City is required"),
  country: z.string().trim().min(1, "Country is required").default("Vietnam"),
  postalCode: z.string().trim().optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{9,}$/, "Invalid phone"),
  website: z.string().trim().url("Invalid URL").optional(),
  logo: z.string().trim().url("Invalid logo URL").optional(),
  taxCode: z.string().trim().min(1, "Tax code is required"),
  businessLicense: z.string().trim().optional(),
  bankAccountName: z.string().trim().min(1, "Bank account name required"),
  bankAccountNumber: z.string().trim().min(10, "Invalid bank account"),
  bankName: z.string().trim().min(1, "Bank name required"),
  bankCode: z.string().trim().min(1, "Bank code required"),
});

export const UpdatePartnerPayloadDTO = z.object({
  cinemaName: z.string().trim().min(1).max(255).optional(),
  address: z.string().trim().min(5).optional(),
  city: z.string().trim().min(1).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{9,}$/)
    .optional(),
  website: z.string().trim().url().optional(),
  logo: z.string().trim().url().optional(),
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

export const CreateMoviePayloadDTO = z.object({
  title: z.string().trim().min(1, "Title required").max(255),
  description: z.string().trim().optional(),
  genre: z.string().trim().min(1, "Genre required"),
  language: z.string().trim().min(1, "Language required").default("en"),
  duration: z.number().int().min(30, "Duration at least 30 minutes"),
  releaseDate: z.string().datetime("Invalid date"),
  endDate: z.string().datetime("Invalid date"),
  posterUrl: z.string().trim().url("Invalid poster URL").optional(),
  trailerUrl: z.string().trim().url("Invalid trailer URL").optional(),
  rating: z.string().trim().optional(),
});

export const UpdateMoviePayloadDTO = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().nullable().optional(),
  genre: z.string().trim().min(1).optional(),
  language: z.string().trim().min(1).optional(),
  duration: z.number().int().min(30).optional(),
  releaseDate: z.date().optional(),
  endDate: z.date().optional(),
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
  cinemaRoomId: z.string().min(1, "Room ID required"),
  startTime: z.string().datetime("Invalid datetime"),
  basePrice: z.number().min(1000, "Price too low"),
  totalSeats: z.number().int().min(1, "At least 1 seat"),
});

export const UpdateShowtimePayloadDTO = z.object({
  basePrice: z.number().min(1000).optional(),
  status: z.enum(["SCHEDULED", "STARTED", "ENDED", "CANCELLED"]).optional(),
});

export const UpdateSeatPayloadDTO = z.object({
  type: z.enum(["STANDARD", "VIP", "PREMIUM", "ACCESSIBLE"]).optional(),
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
  price: z.number().min(0, "Price must > 0").optional(),
  category: z.string().min(1, "Category is required").optional(),
  icon: z.string().nullable().optional(),
});

export const CreateServicePayloadDTO = z.object({
  name: z.string().trim().min(1, "Name is required"),
  price: z.number().min(0, "Price must > 0"),
  category: z.string().min(1, "Category is required"),
  icon: z.string().nullable().optional(),
});

export const ServiceCondDTOSchema = z.object({
  name: z.string().min(2, "name must be at least 3 characters").optional(),
  price: z.number().min(0, "Price must > 0").optional(),
  category: z.string().min(1, "Category is required").optional(),
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
  status: z.enum(["RESERVED", "CONFIRMED", "USED", "CANCELLED", "REFUNDED"]).optional(),
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

/**
 * ==========================================
 * TYPE EXPORTS
 * ==========================================
 */

export type RegisterPartnerDTO = z.infer<typeof RegisterPartnerPayloadDTO>;
export type UpdatePartnerDTO = z.infer<typeof UpdatePartnerPayloadDTO>;

export type CreateMovieDTO = z.infer<typeof CreateMoviePayloadDTO>;
export type UpdateMovieDTO = z.infer<typeof UpdateMoviePayloadDTO>;

export type CreateShowtimeDTO = z.infer<typeof CreateShowtimePayloadDTO>;
export type UpdateShowtimeDTO = z.infer<typeof UpdateShowtimePayloadDTO>;
export type UpdateSeatDTO = z.infer<typeof UpdateSeatPayloadDTO>;
export type LockSeatDTO = z.infer<typeof LockSeatPayloadDTO>;
export type UnlockSeatDTO = z.infer<typeof UnlockSeatPayloadDTO>;

export type CheckInDTO = z.infer<typeof CheckInPayloadDTO>;

export type CreateWithdrawalDTO = z.infer<typeof CreateWithdrawalPayloadDTO>;

export type ListMoviesQueryDTO = z.infer<typeof ListMoviesQueryPayloadDTO>;
export type ListShowtimesQueryDTO = z.infer<typeof ListShowtimesQueryPayloadDTO>;
export type ListTicketsQueryDTO = z.infer<typeof ListTicketsQueryPayloadDTO>;
export type ListWithdrawalsQueryDTO = z.infer<typeof ListWithdrawalsQueryPayloadDTO>;
export type RevenueQueryDTO = z.infer<typeof RevenueQueryPayloadDTO>;

export type CreateServiceDTO = z.infer<typeof CreateServicePayloadDTO>;
export type UpdateServiceDTO = z.infer<typeof UpdateServicePayloadDTO>;
export type ServicesCondDTO = z.infer<typeof ServiceCondDTOSchema>;
