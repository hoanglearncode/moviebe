"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerDashboardUseCase = exports.PartnerFinanceUseCase = exports.TicketCheckInUseCase = exports.SeatManagementUseCase = exports.ShowtimeManagementUseCase = exports.MovieManagementUseCase = exports.PartnerProfileUseCase = void 0;
const uuid_1 = require("uuid");
const http_server_1 = require("../../../share/transport/http-server");
const logger_1 = require("../../system/logger");
const dto_1 = require("../model/dto");
const model_1 = require("../model/model");
/**
 * ==========================================
 * PARTNER PROFILE USE CASE
 * ==========================================
 */
class PartnerProfileUseCase {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    async getProfile(partnerId) {
        if (!partnerId) {
            throw new http_server_1.ValidationError("Partner ID is required");
        }
        const partner = await this.dependencies.partnerRepository.findById(partnerId);
        if (!partner) {
            throw new http_server_1.NotFoundError("Partner not found");
        }
        return partner;
    }
    async updateProfile(partnerId, data) {
        if (!partnerId) {
            throw new http_server_1.ValidationError("Partner ID is required");
        }
        const parsed = dto_1.UpdatePartnerPayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid update data", parsed.error.issues);
        }
        const partner = await this.dependencies.partnerRepository.findById(partnerId);
        if (!partner) {
            throw new http_server_1.NotFoundError("Partner not found");
        }
        await this.dependencies.partnerRepository.update(partnerId, parsed.data);
        logger_1.logger.info(`[Partner] Updated profile for partner ${partnerId}`);
        // Return updated partner object
        return {
            ...partner,
            ...parsed.data,
            updatedAt: new Date(),
        };
    }
    async getStatus(partnerId) {
        if (!partnerId) {
            throw new http_server_1.ValidationError("Partner ID is required");
        }
        const partner = await this.dependencies.partnerRepository.findById(partnerId);
        if (!partner) {
            throw new http_server_1.NotFoundError("Partner not found");
        }
        return {
            status: partner.status,
            approvedAt: partner.approvedAt || undefined,
        };
    }
}
exports.PartnerProfileUseCase = PartnerProfileUseCase;
/**
 * ==========================================
 * MOVIE MANAGEMENT USE CASE
 * ==========================================
 */
class MovieManagementUseCase {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    async createMovie(partnerId, data) {
        const parsed = dto_1.CreateMoviePayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid movie data", parsed.error.issues);
        }
        // Verify partner exists
        const partner = await this.dependencies.partnerRepository.findById(partnerId);
        if (!partner) {
            throw new http_server_1.NotFoundError("Partner not found");
        }
        const movieId = (0, uuid_1.v7)();
        const newMovie = {
            id: movieId,
            partnerId,
            title: parsed.data.title,
            description: parsed.data.description || null,
            genre: parsed.data.genre,
            language: parsed.data.language,
            duration: parsed.data.duration,
            releaseDate: new Date(parsed.data.releaseDate),
            endDate: new Date(parsed.data.endDate),
            posterUrl: parsed.data.posterUrl || null,
            trailerUrl: parsed.data.trailerUrl || null,
            rating: parsed.data.rating || null,
            status: "DRAFT",
            publishedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await this.dependencies.movieRepository.insert(newMovie);
        logger_1.logger.info(`[Movie] Created movie ${movieId} for partner ${partnerId}`);
        return { movieId };
    }
    async getMovies(partnerId, query) {
        const partner = await this.dependencies.partnerRepository.findById(partnerId);
        if (!partner) {
            throw new http_server_1.NotFoundError("Partner not found");
        }
        return this.dependencies.movieRepository.findByPartnerId(partnerId, query);
    }
    async getMovieDetail(partnerId, movieId) {
        const movie = await this.dependencies.movieRepository.findByIdAndPartnerId(movieId, partnerId);
        if (!movie) {
            throw new http_server_1.NotFoundError("Movie not found");
        }
        return movie;
    }
    async updateMovie(partnerId, movieId, data) {
        const parsed = dto_1.UpdateMoviePayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid movie data", parsed.error.issues);
        }
        const movie = await this.dependencies.movieRepository.findByIdAndPartnerId(movieId, partnerId);
        if (!movie) {
            throw new http_server_1.NotFoundError("Movie not found");
        }
        // Can't update if already approved
        if (movie.status === "APPROVED" || movie.status === "ACTIVE") {
            throw new http_server_1.ValidationError("Cannot update published movie");
        }
        // Parse dates from string to Date if provided
        const updateData = { ...parsed.data };
        if (updateData.releaseDate && typeof updateData.releaseDate === "string") {
            updateData.releaseDate = new Date(updateData.releaseDate);
        }
        if (updateData.endDate && typeof updateData.endDate === "string") {
            updateData.endDate = new Date(updateData.endDate);
        }
        await this.dependencies.movieRepository.update(movieId, updateData);
        logger_1.logger.info(`[Movie] Updated movie ${movieId}`);
        // Return updated movie
        return {
            ...movie,
            ...updateData,
            updatedAt: new Date(),
        };
    }
    async deleteMovie(partnerId, movieId) {
        const movie = await this.dependencies.movieRepository.findByIdAndPartnerId(movieId, partnerId);
        if (!movie) {
            throw new http_server_1.NotFoundError("Movie not found");
        }
        if (movie.status === "APPROVED" || movie.status === "ACTIVE") {
            throw new http_server_1.ValidationError("Cannot delete published movie");
        }
        await this.dependencies.movieRepository.delete(movieId, false);
        logger_1.logger.info(`[Movie] Deleted movie ${movieId}`);
        return { message: "Movie deleted successfully" };
    }
    async submitMovieForApproval(partnerId, movieId) {
        const movie = await this.dependencies.movieRepository.findByIdAndPartnerId(movieId, partnerId);
        if (!movie) {
            throw new http_server_1.NotFoundError("Movie not found");
        }
        if (movie.status !== "DRAFT") {
            throw new http_server_1.ValidationError("Only draft movies can be submitted");
        }
        await this.dependencies.movieRepository.updateStatus(movieId, "SUBMITTED");
        logger_1.logger.info(`[Movie] Submitted movie ${movieId} for approval`);
        return { message: "Movie submitted for approval" };
    }
}
exports.MovieManagementUseCase = MovieManagementUseCase;
/**
 * ==========================================
 * SHOWTIME MANAGEMENT USE CASE
 * ==========================================
 */
class ShowtimeManagementUseCase {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    async createShowtime(partnerId, data) {
        const parsed = dto_1.CreateShowtimePayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid showtime data", parsed.error.issues);
        }
        // Verify movie belongs to partner
        const movie = await this.dependencies.movieRepository.findByIdAndPartnerId(parsed.data.movieId, partnerId);
        if (!movie) {
            throw new http_server_1.NotFoundError("Movie not found");
        }
        if (movie.status !== "APPROVED" && movie.status !== "ACTIVE") {
            throw new http_server_1.ValidationError("Movie must be approved to create showtimes");
        }
        const startTime = new Date(parsed.data.startTime);
        const endTime = new Date(startTime.getTime() + (movie.duration + 15) * 60 * 1000); // +15 min buffer
        const showtimeId = (0, uuid_1.v7)();
        const newShowtime = {
            id: showtimeId,
            movieId: parsed.data.movieId,
            partnerId,
            cinemaRoomId: parsed.data.cinemaRoomId,
            startTime,
            endTime,
            basePrice: parsed.data.basePrice,
            status: "SCHEDULED",
            totalSeats: parsed.data.totalSeats,
            availableSeats: parsed.data.totalSeats,
            bookedSeats: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await this.dependencies.showtimeRepository.insert(newShowtime);
        // Create seats for this showtime
        await this.createSeatsForShowtime(newShowtime);
        logger_1.logger.info(`[Showtime] Created showtime ${showtimeId} for movie ${movie.id}`);
        return { showtimeId };
    }
    async getShowtimes(partnerId, query) {
        const partner = await this.dependencies.partnerRepository.findById(partnerId);
        if (!partner) {
            throw new http_server_1.NotFoundError("Partner not found");
        }
        return this.dependencies.showtimeRepository.findByPartnerId(partnerId, query);
    }
    async getShowtimeDetail(partnerId, showtimeId) {
        const showtime = await this.dependencies.showtimeRepository.findByIdAndPartnerId(showtimeId, partnerId);
        if (!showtime) {
            throw new http_server_1.NotFoundError("Showtime not found");
        }
        return showtime;
    }
    async updateShowtime(partnerId, showtimeId, data) {
        const parsed = dto_1.UpdateShowtimePayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid update data", parsed.error.issues);
        }
        const showtime = await this.dependencies.showtimeRepository.findByIdAndPartnerId(showtimeId, partnerId);
        if (!showtime) {
            throw new http_server_1.NotFoundError("Showtime not found");
        }
        if (showtime.status !== "SCHEDULED") {
            throw new http_server_1.ValidationError("Can only update scheduled showtimes");
        }
        const updated = await this.dependencies.showtimeRepository.update(showtimeId, parsed.data);
        return updated;
    }
    async cancelShowtime(partnerId, showtimeId) {
        const showtime = await this.dependencies.showtimeRepository.findByIdAndPartnerId(showtimeId, partnerId);
        if (!showtime) {
            throw new http_server_1.NotFoundError("Showtime not found");
        }
        if (showtime.status === "ENDED" || showtime.status === "CANCELLED") {
            throw new http_server_1.ValidationError("Cannot cancel ended or already cancelled showtime");
        }
        await this.dependencies.showtimeRepository.updateStatus(showtimeId, "CANCELLED");
        logger_1.logger.info(`[Showtime] Cancelled showtime ${showtimeId}`);
        return { message: "Showtime cancelled successfully" };
    }
    // Helper: Create seats for showtime
    async createSeatsForShowtime(showtime) {
        const rows = Math.ceil(Math.sqrt(showtime.totalSeats));
        const cols = Math.ceil(showtime.totalSeats / rows);
        let seatCount = 0;
        const seats = [];
        for (let row = 0; row < rows && seatCount < showtime.totalSeats; row++) {
            for (let col = 0; col < cols && seatCount < showtime.totalSeats; col++) {
                const rowLetter = String.fromCharCode(65 + row); // A, B, C...
                const seatNumber = `${rowLetter}${col + 1}`;
                seats.push({
                    id: (0, uuid_1.v7)(),
                    showtimeId: showtime.id,
                    seatNumber,
                    seatType: model_1.SeatType.STANDARD,
                    status: model_1.SeatStatus.AVAILABLE,
                    price: showtime.basePrice,
                    lockedUntil: null,
                    lockedBy: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                seatCount++;
            }
        }
        // Batch insert seats
        for (const seat of seats) {
            await this.dependencies.seatRepository.insert(seat);
        }
    }
}
exports.ShowtimeManagementUseCase = ShowtimeManagementUseCase;
/**
 * ==========================================
 * SEAT MANAGEMENT USE CASE
 * ==========================================
 */
class SeatManagementUseCase {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    async getSeats(partnerId, showtimeId) {
        // Verify ownership
        const showtime = await this.dependencies.showtimeRepository.findByIdAndPartnerId(showtimeId, partnerId);
        if (!showtime) {
            throw new http_server_1.NotFoundError("Showtime not found");
        }
        return this.dependencies.seatRepository.findByShowtimeId(showtimeId);
    }
    async updateSeat(partnerId, seatId, data) {
        const parsed = dto_1.UpdateSeatPayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid seat data", parsed.error.issues);
        }
        const seat = await this.dependencies.seatRepository.findById(seatId);
        if (!seat) {
            throw new http_server_1.NotFoundError("Seat not found");
        }
        const showtime = await this.dependencies.showtimeRepository.findByIdAndPartnerId(seat.showtimeId, partnerId);
        if (!showtime) {
            throw new http_server_1.UnauthorizedError("You don't have permission to modify this seat");
        }
        const updated = await this.dependencies.seatRepository.update(seatId, parsed.data);
        return updated;
    }
    async getSeatMap(partnerId, showtimeId) {
        const showtime = await this.dependencies.showtimeRepository.findByIdAndPartnerId(showtimeId, partnerId);
        if (!showtime) {
            throw new http_server_1.NotFoundError("Showtime not found");
        }
        const seats = await this.dependencies.seatRepository.findByShowtimeId(showtimeId);
        // Group by row
        const seatMap = {};
        seats.forEach((seat) => {
            const row = seat.seatNumber.charAt(0);
            if (!seatMap[row]) {
                seatMap[row] = [];
            }
            seatMap[row].push({
                id: seat.id,
                seatNumber: seat.seatNumber,
                status: seat.status,
                type: seat.seatType,
                price: seat.price,
            });
        });
        return {
            showtimeId,
            totalSeats: showtime.totalSeats,
            availableSeats: showtime.availableSeats,
            bookedSeats: showtime.bookedSeats,
            seatMap,
        };
    }
}
exports.SeatManagementUseCase = SeatManagementUseCase;
/**
 * ==========================================
 * TICKET & CHECK-IN USE CASE
 * ==========================================
 */
class TicketCheckInUseCase {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    async getTickets(partnerId, query) {
        const partner = await this.dependencies.partnerRepository.findById(partnerId);
        if (!partner) {
            throw new http_server_1.NotFoundError("Partner not found");
        }
        return this.dependencies.ticketRepository.findByPartnerId(partnerId, query);
    }
    async getTicketDetail(partnerId, ticketId) {
        const ticket = await this.dependencies.ticketRepository.findById(ticketId);
        if (!ticket || ticket.partnerId !== partnerId) {
            throw new http_server_1.NotFoundError("Ticket not found");
        }
        return ticket;
    }
    async checkInTicket(partnerId, data) {
        const parsed = dto_1.CheckInPayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid check-in data", parsed.error.issues);
        }
        // Find ticket by QR code
        const ticket = await this.dependencies.ticketRepository.findByQRCode(parsed.data.qrCode);
        if (!ticket) {
            throw new http_server_1.NotFoundError("Ticket not found");
        }
        if (ticket.partnerId !== partnerId) {
            throw new http_server_1.UnauthorizedError("You don't have permission to check in this ticket");
        }
        if (ticket.status !== "CONFIRMED") {
            throw new http_server_1.ValidationError("Ticket is not in confirmed status");
        }
        // Check if already used
        const existingCheckIn = await this.dependencies.checkInRepository.findByTicketId(ticket.id);
        if (existingCheckIn) {
            throw new http_server_1.ValidationError("Ticket already checked in");
        }
        // Create check-in record
        const checkIn = {
            id: (0, uuid_1.v7)(),
            ticketId: ticket.id,
            partnerId,
            showtimeId: ticket.showtimeId,
            userId: ticket.userId,
            scannedAt: new Date(),
            scannedBy: parsed.data.scannedBy,
            ipAddress: parsed.data.ipAddress || null,
            deviceInfo: null,
            createdAt: new Date(),
        };
        await this.dependencies.checkInRepository.insert(checkIn);
        // Update ticket status
        await this.dependencies.ticketRepository.updateStatus(ticket.id, "USED");
        logger_1.logger.info(`[CheckIn] Checked in ticket ${ticket.id}`);
        return { message: "Check-in successful", ticketId: ticket.id };
    }
    async getCheckInHistory(partnerId, showtimeId) {
        const showtime = await this.dependencies.showtimeRepository.findByIdAndPartnerId(showtimeId, partnerId);
        if (!showtime) {
            throw new http_server_1.NotFoundError("Showtime not found");
        }
        return this.dependencies.checkInRepository.findByShowtimeId(showtimeId);
    }
}
exports.TicketCheckInUseCase = TicketCheckInUseCase;
/**
 * ==========================================
 * PARTNER FINANCE USE CASE
 * ==========================================
 */
class PartnerFinanceUseCase {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    async getWallet(partnerId) {
        let wallet = await this.dependencies.walletRepository.findByPartnerId(partnerId);
        if (!wallet) {
            // Create wallet if not exists
            const newWallet = {
                id: (0, uuid_1.v7)(),
                partnerId,
                balance: 0,
                totalEarned: 0,
                totalWithdrawn: 0,
                totalRefunded: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            wallet = await this.dependencies.walletRepository.insert(newWallet);
        }
        return wallet;
    }
    async getTransactions(partnerId) {
        return this.dependencies.transactionRepository.findByPartnerId(partnerId);
    }
    async getRevenue(partnerId, query) {
        if (!query.startDate || !query.endDate) {
            throw new http_server_1.ValidationError("Start date and end date are required");
        }
        const revenue = await this.dependencies.transactionRepository.findRevenueByPeriod(partnerId, new Date(query.startDate), new Date(query.endDate));
        return {
            period: `${query.startDate} to ${query.endDate}`,
            totalRevenue: revenue.amount,
            ticketsSold: revenue.count,
        };
    }
    async getRevenueByMovie(partnerId, startDate, endDate) {
        // TODO: Implement grouping by movie
        return [];
    }
    async createWithdrawal(partnerId, data) {
        const parsed = dto_1.CreateWithdrawalPayloadDTO.safeParse(data);
        if (!parsed.success) {
            throw new http_server_1.ValidationError("Invalid withdrawal data", parsed.error.issues);
        }
        const wallet = await this.getWallet(partnerId);
        if (wallet.balance < parsed.data.amount) {
            throw new http_server_1.ValidationError("Insufficient balance");
        }
        const withdrawalId = (0, uuid_1.v7)();
        const newWithdrawal = {
            id: withdrawalId,
            partnerId,
            amount: parsed.data.amount,
            bankAccountNumber: parsed.data.bankAccountNumber,
            bankName: parsed.data.bankName,
            bankCode: parsed.data.bankCode,
            status: model_1.WithdrawalStatus.PENDING,
            transactionReference: null,
            failureReason: null,
            processedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await this.dependencies.withdrawalRepository.insert(newWithdrawal);
        // Deduct from balance
        await this.dependencies.walletRepository.decrementBalance(partnerId, parsed.data.amount);
        logger_1.logger.info(`[Withdrawal] Created withdrawal ${withdrawalId} for amount ${parsed.data.amount}`);
        return { withdrawalId };
    }
    async getWithdrawals(partnerId, query) {
        return this.dependencies.withdrawalRepository.findByPartnerId(partnerId, query);
    }
    async getWithdrawalDetail(partnerId, withdrawalId) {
        const withdrawal = await this.dependencies.withdrawalRepository.findById(withdrawalId);
        if (!withdrawal || withdrawal.partnerId !== partnerId) {
            throw new http_server_1.NotFoundError("Withdrawal not found");
        }
        return withdrawal;
    }
}
exports.PartnerFinanceUseCase = PartnerFinanceUseCase;
/**
 * ==========================================
 * PARTNER DASHBOARD USE CASE
 * ==========================================
 */
class PartnerDashboardUseCase {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    async getDashboardStats(partnerId) {
        const wallet = await this.dependencies.walletRepository.findByPartnerId(partnerId);
        const pendingWithdrawals = await this.dependencies.withdrawalRepository.findByPartnerId(partnerId, {
            page: 1,
            limit: 100,
            status: "PENDING",
        });
        return {
            walletBalance: wallet?.balance || 0,
            totalEarned: wallet?.totalEarned || 0,
            totalWithdrawn: wallet?.totalWithdrawn || 0,
            pendingWithdrawals: pendingWithdrawals.total,
        };
    }
    async getTopMovies(partnerId, limit) {
        // TODO: Implement grouping by movie with ticket count and revenue
        return [];
    }
    async getOccupancyStats(partnerId, startDate, endDate) {
        // TODO: Implement occupancy calculation
        return {};
    }
}
exports.PartnerDashboardUseCase = PartnerDashboardUseCase;
