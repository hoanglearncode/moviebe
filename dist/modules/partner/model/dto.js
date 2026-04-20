"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestCondDTOSchema = exports.RevenueQueryPayloadDTO = exports.ListWithdrawalsQueryPayloadDTO = exports.ListTicketsQueryPayloadDTO = exports.ListShowtimesQueryPayloadDTO = exports.ListMoviesQueryPayloadDTO = exports.ServiceCondDTOSchema = exports.CreateServicePayloadDTO = exports.UpdateServicePayloadDTO = exports.CreateWithdrawalPayloadDTO = exports.CheckInPayloadDTO = exports.UnlockSeatPayloadDTO = exports.LockSeatPayloadDTO = exports.UpdateSeatPayloadDTO = exports.UpdateShowtimePayloadDTO = exports.CreateShowtimePayloadDTO = exports.UpdateMoviePayloadDTO = exports.CreateMoviePayloadDTO = exports.UpdatePartnerPayloadDTO = exports.SubmitPartnerRequestSchema = void 0;
const zod_1 = __importDefault(require("zod"));
/**
 * ==========================================
 * PARTNER PROFILE DTOs
 * ==========================================
 */
exports.SubmitPartnerRequestSchema = zod_1.default.object({
    cinemaName: zod_1.default.string().trim().min(1, "Cinema name is required").max(255),
    address: zod_1.default.string().trim().min(5, "Address is required"),
    city: zod_1.default.string().trim().min(1, "City is required"),
    phone: zod_1.default.string().trim().regex(/^\+?[0-9\s\-()]{9,}$/, "Invalid phone number"),
    email: zod_1.default.string().trim().email("Invalid email"),
    logo: zod_1.default.string().trim().url().optional(),
    taxCode: zod_1.default.string().trim().min(1, "Tax code is required"),
    businessLicense: zod_1.default.string().trim().min(1, "Business license is required"),
    businessLicenseFile: zod_1.default.string().trim().url("Invalid license file URL"),
    representativeName: zod_1.default.string().trim().min(1, "Representative name is required"),
    representativeIdNumber: zod_1.default.string().trim().min(9, "Invalid ID number"),
    representativeIdFile: zod_1.default.string().trim().url("Invalid ID file URL"),
    taxCertificateFile: zod_1.default.string().trim().url("Invalid tax certificate file URL"),
    bankAccountName: zod_1.default.string().trim().min(1, "Bank account name is required"),
    bankAccountNumber: zod_1.default.string().trim().min(10, "Invalid bank account number"),
    bankName: zod_1.default.string().trim().min(1, "Bank name is required"),
});
exports.UpdatePartnerPayloadDTO = zod_1.default.object({
    cinemaName: zod_1.default.string().trim().min(1).max(255).optional(),
    address: zod_1.default.string().trim().min(5).optional(),
    city: zod_1.default.string().trim().min(1).optional(),
    country: zod_1.default.string().trim().min(1).optional(),
    postalCode: zod_1.default.string().trim().optional().nullable(),
    phone: zod_1.default.string().trim().regex(/^\+?[0-9\s\-()]{9,}$/).optional(),
    email: zod_1.default.string().trim().email().optional(),
    website: zod_1.default.string().trim().url().optional().nullable(),
    logo: zod_1.default.string().trim().url().optional().nullable(),
    taxCode: zod_1.default.string().trim().min(1).optional(),
    businessLicense: zod_1.default.string().trim().min(1).optional(),
    businessLicenseFile: zod_1.default.string().trim().url().optional(),
    representativeName: zod_1.default.string().trim().min(1).optional(),
    representativeIdNumber: zod_1.default.string().trim().min(9).optional(),
    representativeIdFile: zod_1.default.string().trim().url().optional(),
    taxCertificateFile: zod_1.default.string().trim().url().optional(),
    bankAccountName: zod_1.default.string().trim().min(1).optional(),
    bankAccountNumber: zod_1.default.string().trim().min(10).optional(),
    bankName: zod_1.default.string().trim().min(1).optional(),
    bankCode: zod_1.default.string().trim().min(1).optional(),
});
/**
 * ==========================================
 * MOVIE DTOs
 * ==========================================
 */
exports.CreateMoviePayloadDTO = zod_1.default.object({
    title: zod_1.default.string().trim().min(1, "Title required").max(255),
    description: zod_1.default.string().trim().optional(),
    genre: zod_1.default.array(zod_1.default.string().trim().min(1, "Genre required")).min(1, "Genre required"),
    language: zod_1.default.string().trim().min(1, "Language required").default("en"),
    duration: zod_1.default.number().int().min(30, "Duration at least 30 minutes"),
    releaseDate: zod_1.default.string().datetime("Invalid date"),
    endDate: zod_1.default.string().datetime("Invalid date"),
    posterUrl: zod_1.default.string().trim().url("Invalid poster URL").optional(),
    trailerUrl: zod_1.default.string().trim().url("Invalid trailer URL").optional(),
    rating: zod_1.default.string().trim().optional(),
});
exports.UpdateMoviePayloadDTO = zod_1.default.object({
    title: zod_1.default.string().trim().min(1).max(255).optional(),
    description: zod_1.default.string().trim().nullable().optional(),
    genre: zod_1.default.array(zod_1.default.string().trim().min(1)).min(1).optional(),
    language: zod_1.default.string().trim().min(1).optional(),
    duration: zod_1.default.number().int().min(30).optional(),
    releaseDate: zod_1.default.string().datetime().optional(),
    endDate: zod_1.default.string().datetime().optional(),
    posterUrl: zod_1.default.string().trim().url().optional(),
    trailerUrl: zod_1.default.string().trim().url().optional(),
    rating: zod_1.default.string().trim().optional(),
});
/**
 * ==========================================
 * SHOWTIME & SEAT DTOs
 * ==========================================
 */
exports.CreateShowtimePayloadDTO = zod_1.default.object({
    movieId: zod_1.default.string().min(1, "Movie ID required"),
    roomId: zod_1.default.string().min(1, "Room ID required"),
    startTime: zod_1.default.string().datetime("Invalid datetime"),
    basePrice: zod_1.default.number().min(1000, "Price too low"),
    totalSeats: zod_1.default.number().int().min(1, "At least 1 seat"),
});
exports.UpdateShowtimePayloadDTO = zod_1.default.object({
    basePrice: zod_1.default.number().min(1000).optional(),
    status: zod_1.default.enum(["SCHEDULED", "STARTED", "ENDED", "CANCELLED"]).optional(),
});
exports.UpdateSeatPayloadDTO = zod_1.default.object({
    type: zod_1.default.enum(["STANDARD", "VIP", "COUPLE", "BLOCKED"]).optional(),
    status: zod_1.default.enum(["AVAILABLE", "LOCKED", "BOOKED", "MAINTENANCE"]).optional(),
    price: zod_1.default.number().min(1000).optional(),
});
exports.LockSeatPayloadDTO = zod_1.default.object({
    showtimeId: zod_1.default.string().min(1),
    seatIds: zod_1.default.array(zod_1.default.string()).min(1, "Select at least one seat"),
    durationMinutes: zod_1.default.number().int().min(5).max(30).default(10),
});
exports.UnlockSeatPayloadDTO = zod_1.default.object({
    seatIds: zod_1.default.array(zod_1.default.string()).min(1),
});
/**
 * ==========================================
 * TICKET DTOs
 * ==========================================
 */
exports.CheckInPayloadDTO = zod_1.default.object({
    qrCode: zod_1.default.string().min(1, "QR code required"),
    scannedBy: zod_1.default.string().min(1, "Scanner ID required"),
    ipAddress: zod_1.default.string().optional(),
});
/**
 * ==========================================
 * FINANCE DTOs
 * ==========================================
 */
exports.CreateWithdrawalPayloadDTO = zod_1.default.object({
    amount: zod_1.default.number().min(100000, "Minimum withdrawal 100k VND"),
    bankAccountNumber: zod_1.default.string().trim().min(10, "Invalid account"),
    bankName: zod_1.default.string().trim().min(1, "Bank name required"),
    bankCode: zod_1.default.string().trim().min(1, "Bank code required"),
    note: zod_1.default.string().trim().optional(),
});
/**
 * ==========================================
 * SERVICE DTOs
 * ==========================================
 */
exports.UpdateServicePayloadDTO = zod_1.default.object({
    name: zod_1.default.string().trim().min(1, "Name is required").optional(),
    price: zod_1.default.coerce.number().min(0, "Price must > 0").optional(),
    category: zod_1.default.string().trim().min(1, "Category is required").optional(),
    icon: zod_1.default.string().nullable().optional(),
    roomIds: zod_1.default.array(zod_1.default.string().trim().min(1, "Room ID is required")).optional(),
});
exports.CreateServicePayloadDTO = zod_1.default.object({
    name: zod_1.default.string().trim().min(1, "Name is required"),
    price: zod_1.default.coerce.number().min(0, "Price must > 0"),
    category: zod_1.default.string().trim().min(1, "Category is required"),
    icon: zod_1.default.string().nullable().optional(),
    roomIds: zod_1.default.array(zod_1.default.string().trim().min(1, "Room ID is required")).default([]),
});
exports.ServiceCondDTOSchema = zod_1.default.object({
    name: zod_1.default.string().trim().min(2, "name must be at least 2 characters").optional(),
    price: zod_1.default.coerce.number().min(0, "Price must > 0").optional(),
    category: zod_1.default.string().trim().min(1, "Category is required").optional(),
    roomId: zod_1.default.string().trim().min(1, "Room ID is required").optional(),
});
/**
 * ==========================================
 * QUERY DTOs
 * ==========================================
 */
exports.ListMoviesQueryPayloadDTO = zod_1.default.object({
    page: zod_1.default.number().int().min(1).default(1),
    limit: zod_1.default.number().int().min(1).max(100).default(20),
    status: zod_1.default.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "ACTIVE", "INACTIVE"]).optional(),
    keyword: zod_1.default.string().trim().optional(),
    sortBy: zod_1.default.enum(["createdAt", "title", "releaseDate"]).default("createdAt"),
    sortOrder: zod_1.default.enum(["asc", "desc"]).default("desc"),
});
exports.ListShowtimesQueryPayloadDTO = zod_1.default.object({
    page: zod_1.default.number().int().min(1).default(1),
    limit: zod_1.default.number().int().min(1).max(100).default(20),
    movieId: zod_1.default.string().optional(),
    startDate: zod_1.default.string().datetime().optional(),
    endDate: zod_1.default.string().datetime().optional(),
    status: zod_1.default.enum(["SCHEDULED", "STARTED", "ENDED", "CANCELLED"]).optional(),
    sortBy: zod_1.default.enum(["startTime", "createdAt"]).default("startTime"),
    sortOrder: zod_1.default.enum(["asc", "desc"]).default("asc"),
});
exports.ListTicketsQueryPayloadDTO = zod_1.default.object({
    page: zod_1.default.number().int().min(1).default(1),
    limit: zod_1.default.number().int().min(1).max(100).default(20),
    showtimeId: zod_1.default.string().optional(),
    status: zod_1.default.enum(["RESERVED", "CONFIRMED", "USED", "CANCELLED", "REFUNDED", "PASSED"]).optional(),
    startDate: zod_1.default.string().datetime().optional(),
    endDate: zod_1.default.string().datetime().optional(),
});
exports.ListWithdrawalsQueryPayloadDTO = zod_1.default.object({
    page: zod_1.default.number().int().min(1).default(1),
    limit: zod_1.default.number().int().min(1).max(100).default(20),
    status: zod_1.default.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
    startDate: zod_1.default.string().datetime().optional(),
    endDate: zod_1.default.string().datetime().optional(),
});
exports.RevenueQueryPayloadDTO = zod_1.default.object({
    startDate: zod_1.default.string().datetime(),
    endDate: zod_1.default.string().datetime(),
    groupBy: zod_1.default.enum(["DAY", "MONTH", "MOVIE"]).default("DAY"),
});
exports.RequestCondDTOSchema = zod_1.default.object({
    page: zod_1.default.coerce.number().default(1),
    limit: zod_1.default.coerce.number().default(10),
    status: zod_1.default
        .enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"])
        .optional(),
    search: zod_1.default.string().optional()
});
