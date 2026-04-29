"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerDashboardHttpService = exports.PartnerFinanceHttpService = exports.TicketCheckInHttpService = exports.SeatManagementHttpService = exports.ShowtimeManagementHttpService = exports.MovieManagementHttpService = exports.PartnerProfileHttpService = void 0;
const http_server_1 = require("../../../../share/transport/http-server");
/**
 * ==========================================
 * PARTNER PROFILE HTTP SERVICE
 * ==========================================
 */
class PartnerProfileHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async getProfile(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const profile = await this.useCase.getProfile(partnerId);
            (0, http_server_1.successResponse)(res, profile, "Profile retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async updateProfile(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const data = req.body;
            const updated = await this.useCase.updateProfile(partnerId, data);
            (0, http_server_1.successResponse)(res, updated, "Profile updated successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async getStatus(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const status = await this.useCase.getStatus(partnerId);
            (0, http_server_1.successResponse)(res, status, "Status retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
}
exports.PartnerProfileHttpService = PartnerProfileHttpService;
/**
 * ==========================================
 * MOVIE MANAGEMENT HTTP SERVICE
 * ==========================================
 */
class MovieManagementHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async createMovie(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const data = req.body;
            const result = await this.useCase.createMovie(partnerId, data);
            (0, http_server_1.successResponse)(res, result, "Movie created successfully", 201);
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async getMovies(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const query = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                status: req.query.status,
                keyword: req.query.keyword,
                sortBy: req.query.sortBy || "createdAt",
                sortOrder: req.query.sortOrder || "desc",
            };
            const result = await this.useCase.getMovies(partnerId, query);
            (0, http_server_1.successResponse)(res, result, "Movies retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async getMovieDetail(req, res) {
        try {
            const partnerId = req.partnerId;
            const { movieId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const movie = await this.useCase.getMovieDetail(partnerId, String(movieId));
            (0, http_server_1.successResponse)(res, movie, "Movie retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 404, error.message, error.code);
        }
    }
    async updateMovie(req, res) {
        try {
            const partnerId = req.partnerId;
            const { movieId } = req.params;
            const data = req.body;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const updated = await this.useCase.updateMovie(partnerId, String(movieId), data);
            (0, http_server_1.successResponse)(res, updated, "Movie updated successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async deleteMovie(req, res) {
        try {
            const partnerId = req.partnerId;
            const { movieId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const result = await this.useCase.deleteMovie(partnerId, String(movieId));
            (0, http_server_1.successResponse)(res, result, "Movie deleted successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async submitMovie(req, res) {
        try {
            const partnerId = req.partnerId;
            const { movieId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const result = await this.useCase.submitMovieForApproval(partnerId, String(movieId));
            (0, http_server_1.successResponse)(res, result, "Movie submitted for approval");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
}
exports.MovieManagementHttpService = MovieManagementHttpService;
/**
 * ==========================================
 * SHOWTIME MANAGEMENT HTTP SERVICE
 * ==========================================
 */
class ShowtimeManagementHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async createShowtime(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const data = req.body;
            const result = await this.useCase.createShowtime(partnerId, data);
            (0, http_server_1.successResponse)(res, result, "Showtime created successfully", 201);
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async getShowtimes(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const query = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                movieId: req.query.movieId,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                status: req.query.status,
                sortBy: req.query.sortBy || "startTime",
                sortOrder: req.query.sortOrder || "asc",
            };
            const result = await this.useCase.getShowtimes(partnerId, query);
            (0, http_server_1.successResponse)(res, result, "Showtimes retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async getShowtimeDetail(req, res) {
        try {
            const partnerId = req.partnerId;
            const { showtimeId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const showtime = await this.useCase.getShowtimeDetail(partnerId, String(showtimeId));
            (0, http_server_1.successResponse)(res, showtime, "Showtime retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 404, error.message, error.code);
        }
    }
    async updateShowtime(req, res) {
        try {
            const partnerId = req.partnerId;
            const { showtimeId } = req.params;
            const data = req.body;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const updated = await this.useCase.updateShowtime(partnerId, String(showtimeId), data);
            (0, http_server_1.successResponse)(res, updated, "Showtime updated successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async cancelShowtime(req, res) {
        try {
            const partnerId = req.partnerId;
            const { showtimeId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const result = await this.useCase.cancelShowtime(partnerId, String(showtimeId));
            (0, http_server_1.successResponse)(res, result, "Showtime cancelled successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
}
exports.ShowtimeManagementHttpService = ShowtimeManagementHttpService;
/**
 * ==========================================
 * SEAT MANAGEMENT HTTP SERVICE
 * ==========================================
 */
class SeatManagementHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async getSeats(req, res) {
        try {
            const partnerId = req.partnerId;
            const { showtimeId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const seats = await this.useCase.getSeats(partnerId, String(showtimeId));
            (0, http_server_1.successResponse)(res, seats, "Seats retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async updateSeat(req, res) {
        try {
            const partnerId = req.partnerId;
            const { seatId } = req.params;
            const data = req.body;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const updated = await this.useCase.updateSeat(partnerId, String(seatId), data);
            (0, http_server_1.successResponse)(res, updated, "Seat updated successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async getSeatMap(req, res) {
        try {
            const partnerId = req.partnerId;
            const { showtimeId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const seatMap = await this.useCase.getSeatMap(partnerId, String(showtimeId));
            (0, http_server_1.successResponse)(res, seatMap, "Seat map retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
}
exports.SeatManagementHttpService = SeatManagementHttpService;
/**
 * ==========================================
 * TICKET & CHECK-IN HTTP SERVICE
 * ==========================================
 */
class TicketCheckInHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async getTickets(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const query = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                showtimeId: req.query.showtimeId,
                status: req.query.status,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            };
            const result = await this.useCase.getTickets(partnerId, query);
            (0, http_server_1.successResponse)(res, result, "Tickets retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async getTicketDetail(req, res) {
        try {
            const partnerId = req.partnerId;
            const { ticketId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const ticket = await this.useCase.getTicketDetail(partnerId, String(ticketId));
            (0, http_server_1.successResponse)(res, ticket, "Ticket retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 404, error.message, error.code);
        }
    }
    async checkIn(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const data = req.body;
            const result = await this.useCase.checkInTicket(partnerId, data);
            (0, http_server_1.successResponse)(res, result, "Check-in successful");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async getCheckInHistory(req, res) {
        try {
            const partnerId = req.partnerId;
            const { showtimeId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const history = await this.useCase.getCheckInHistory(partnerId, String(showtimeId));
            (0, http_server_1.successResponse)(res, history, "Check-in history retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
}
exports.TicketCheckInHttpService = TicketCheckInHttpService;
/**
 * ==========================================
 * FINANCE HTTP SERVICE
 * ==========================================
 */
class PartnerFinanceHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async getWallet(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const wallet = await this.useCase.getWallet(partnerId);
            (0, http_server_1.successResponse)(res, wallet, "Wallet retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async getTransactions(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const transactions = await this.useCase.getTransactions(partnerId);
            (0, http_server_1.successResponse)(res, transactions, "Transactions retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async getRevenue(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const query = {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                groupBy: req.query.groupBy || "DAY",
            };
            const revenue = await this.useCase.getRevenue(partnerId, query);
            (0, http_server_1.successResponse)(res, revenue, "Revenue retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async createWithdrawal(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const data = req.body;
            const result = await this.useCase.createWithdrawal(partnerId, data);
            (0, http_server_1.successResponse)(res, result, "Withdrawal created successfully", 201);
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    async getWithdrawals(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const query = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                status: req.query.status,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            };
            const result = await this.useCase.getWithdrawals(partnerId, query);
            (0, http_server_1.successResponse)(res, result, "Withdrawals retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async getWithdrawalDetail(req, res) {
        try {
            const partnerId = req.partnerId;
            const { withdrawalId } = req.params;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const withdrawal = await this.useCase.getWithdrawalDetail(partnerId, String(withdrawalId));
            (0, http_server_1.successResponse)(res, withdrawal, "Withdrawal retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 404, error.message, error.code);
        }
    }
}
exports.PartnerFinanceHttpService = PartnerFinanceHttpService;
/**
 * ==========================================
 * DASHBOARD HTTP SERVICE
 * ==========================================
 */
class PartnerDashboardHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async getDashboard(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const stats = await this.useCase.getDashboardStats(partnerId);
            (0, http_server_1.successResponse)(res, stats, "Dashboard stats retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async getTopMovies(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const topMovies = await this.useCase.getTopMovies(partnerId, limit);
            (0, http_server_1.successResponse)(res, topMovies, "Top movies retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    async getOccupancy(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
            const stats = await this.useCase.getOccupancyStats(partnerId, startDate, endDate);
            (0, http_server_1.successResponse)(res, stats, "Occupancy stats retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
}
exports.PartnerDashboardHttpService = PartnerDashboardHttpService;
