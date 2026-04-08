"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPartnerHexagon = setupPartnerHexagon;
exports.setupPartnerHexagonWithUseCase = setupPartnerHexagonWithUseCase;
const express_1 = require("express");
const logger_1 = require("../../../../share/component/logger");
const middleware_1 = require("../../../../share/transport/middleware");
// Repositories
const repo_1 = require("./repository/repo");
// Use Cases
const usecase_1 = require("./usecase");
// HTTP Services
const http_service_1 = require("./transport/http-service");
/**
 * Partners access control middleware
 * Verifies user has PARTNER or ADMIN role
 */
function requirePartnerRole(req, res, next) {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }
    const allowedRoles = ["PARTNER", "ADMIN"];
    if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
    }
    next();
}
/**
 * Setup Partner Module Hexagon with Dependency Injection
 * @param prisma PrismaClient instance
 * @returns Configured Express Router
 */
function setupPartnerHexagon(prisma) {
    logger_1.logger.info("Setting up Partner Hexagon");
    const router = (0, express_1.Router)();
    // =========================================
    // Repository Layer
    // =========================================
    const partnerRepository = (0, repo_1.createPartnerRepository)(prisma);
    const movieRepository = (0, repo_1.createMovieRepository)(prisma);
    const showtimeRepository = (0, repo_1.createShowtimeRepository)(prisma);
    const seatRepository = (0, repo_1.createSeatRepository)(prisma);
    const ticketRepository = (0, repo_1.createTicketRepository)(prisma);
    const transactionRepository = (0, repo_1.createTransactionRepository)(prisma);
    const withdrawalRepository = (0, repo_1.createWithdrawalRepository)(prisma);
    const checkInRepository = (0, repo_1.createCheckInRepository)(prisma);
    const walletRepository = (0, repo_1.createWalletRepository)(prisma);
    // =========================================
    // Use Case Layer
    // =========================================
    const partnerProfileUseCase = new usecase_1.PartnerProfileUseCase({
        partnerRepository,
    });
    const movieManagementUseCase = new usecase_1.MovieManagementUseCase({
        movieRepository,
        partnerRepository,
        seatRepository,
    });
    const showtimeManagementUseCase = new usecase_1.ShowtimeManagementUseCase({
        showtimeRepository,
        movieRepository,
        partnerRepository,
        seatRepository,
    });
    const seatManagementUseCase = new usecase_1.SeatManagementUseCase({
        seatRepository,
        showtimeRepository,
        partnerRepository,
    });
    const ticketCheckInUseCase = new usecase_1.TicketCheckInUseCase({
        ticketRepository,
        checkInRepository,
        seatRepository,
        partnerRepository,
    });
    const partnerFinanceUseCase = new usecase_1.PartnerFinanceUseCase({
        walletRepository,
        transactionRepository,
        withdrawalRepository,
        ticketRepository,
        movieRepository,
        partnerRepository,
    });
    const partnerDashboardUseCase = new usecase_1.PartnerDashboardUseCase({
        walletRepository,
        ticketRepository,
        movieRepository,
        showtimeRepository,
        partnerRepository,
    });
    // =========================================
    // HTTP Service Layer
    // =========================================
    const partnerProfileHttpService = new http_service_1.PartnerProfileHttpService(partnerProfileUseCase);
    const movieHttpService = new http_service_1.MovieManagementHttpService(movieManagementUseCase);
    const showtimeHttpService = new http_service_1.ShowtimeManagementHttpService(showtimeManagementUseCase);
    const seatHttpService = new http_service_1.SeatManagementHttpService(seatManagementUseCase);
    const ticketHttpService = new http_service_1.TicketCheckInHttpService(ticketCheckInUseCase);
    const financeHttpService = new http_service_1.PartnerFinanceHttpService(partnerFinanceUseCase);
    const dashboardHttpService = new http_service_1.PartnerDashboardHttpService(partnerDashboardUseCase);
    // =========================================
    // Middleware Stack
    // =========================================
    router.use(middleware_1.authMiddleware);
    router.use(requirePartnerRole);
    // =========================================
    // Partner Profile Routes
    // =========================================
    router.get("/me", (req, res) => partnerProfileHttpService.getProfile(req, res));
    router.put("/me", (req, res) => partnerProfileHttpService.updateProfile(req, res));
    router.get("/status", (req, res) => partnerProfileHttpService.getStatus(req, res));
    // =========================================
    // Movie Management Routes
    // =========================================
    router.post("/movies", (req, res) => movieHttpService.createMovie(req, res));
    router.get("/movies", (req, res) => movieHttpService.getMovies(req, res));
    router.get("/movies/:movieId", (req, res) => movieHttpService.getMovieDetail(req, res));
    router.put("/movies/:movieId", (req, res) => movieHttpService.updateMovie(req, res));
    router.delete("/movies/:movieId", (req, res) => movieHttpService.deleteMovie(req, res));
    router.post("/movies/:movieId/submit", (req, res) => movieHttpService.submitMovie(req, res));
    // =========================================
    // Showtime Management Routes
    // =========================================
    router.post("/showtimes", (req, res) => showtimeHttpService.createShowtime(req, res));
    router.get("/showtimes", (req, res) => showtimeHttpService.getShowtimes(req, res));
    router.get("/showtimes/:showtimeId", (req, res) => showtimeHttpService.getShowtimeDetail(req, res));
    router.put("/showtimes/:showtimeId", (req, res) => showtimeHttpService.updateShowtime(req, res));
    router.delete("/showtimes/:showtimeId", (req, res) => showtimeHttpService.cancelShowtime(req, res));
    // =========================================
    // Seat Management Routes
    // =========================================
    router.get("/showtimes/:showtimeId/seats", (req, res) => seatHttpService.getSeats(req, res));
    router.put("/seats/:seatId", (req, res) => seatHttpService.updateSeat(req, res));
    router.get("/showtimes/:showtimeId/seat-map", (req, res) => seatHttpService.getSeatMap(req, res));
    // =========================================
    // Ticket & Check-in Routes
    // =========================================
    router.get("/tickets", (req, res) => ticketHttpService.getTickets(req, res));
    router.get("/tickets/:ticketId", (req, res) => ticketHttpService.getTicketDetail(req, res));
    router.post("/tickets/check-in", (req, res) => ticketHttpService.checkIn(req, res));
    router.get("/showtimes/:showtimeId/check-ins", (req, res) => ticketHttpService.getCheckInHistory(req, res));
    // =========================================
    // Finance Routes
    // =========================================
    router.get("/wallet", (req, res) => financeHttpService.getWallet(req, res));
    router.get("/transactions", (req, res) => financeHttpService.getTransactions(req, res));
    router.get("/revenue", (req, res) => financeHttpService.getRevenue(req, res));
    router.post("/withdrawals", (req, res) => financeHttpService.createWithdrawal(req, res));
    router.get("/withdrawals", (req, res) => financeHttpService.getWithdrawals(req, res));
    router.get("/withdrawals/:withdrawalId", (req, res) => financeHttpService.getWithdrawalDetail(req, res));
    // =========================================
    // Dashboard Routes
    // =========================================
    router.get("/dashboard", (req, res) => dashboardHttpService.getDashboard(req, res));
    router.get("/stats/top-movies", (req, res) => dashboardHttpService.getTopMovies(req, res));
    router.get("/stats/occupancy", (req, res) => dashboardHttpService.getOccupancy(req, res));
    logger_1.logger.info("Partner Hexagon setup completed");
    return router;
}
/**
 * Export using the setupUserHexagon pattern for consistency
 * setupPartnerHexagonWithUseCase can be used when you need direct use case access
 */
function setupPartnerHexagonWithUseCase(prisma) {
    const repositories = {
        partnerRepository: (0, repo_1.createPartnerRepository)(prisma),
        movieRepository: (0, repo_1.createMovieRepository)(prisma),
        showtimeRepository: (0, repo_1.createShowtimeRepository)(prisma),
        seatRepository: (0, repo_1.createSeatRepository)(prisma),
        ticketRepository: (0, repo_1.createTicketRepository)(prisma),
        transactionRepository: (0, repo_1.createTransactionRepository)(prisma),
        withdrawalRepository: (0, repo_1.createWithdrawalRepository)(prisma),
        checkInRepository: (0, repo_1.createCheckInRepository)(prisma),
        walletRepository: (0, repo_1.createWalletRepository)(prisma),
    };
    const useCases = {
        partnerProfileUseCase: new usecase_1.PartnerProfileUseCase({
            partnerRepository: repositories.partnerRepository,
        }),
        movieManagementUseCase: new usecase_1.MovieManagementUseCase({
            movieRepository: repositories.movieRepository,
            partnerRepository: repositories.partnerRepository,
            seatRepository: repositories.seatRepository,
        }),
        showtimeManagementUseCase: new usecase_1.ShowtimeManagementUseCase({
            showtimeRepository: repositories.showtimeRepository,
            movieRepository: repositories.movieRepository,
            partnerRepository: repositories.partnerRepository,
            seatRepository: repositories.seatRepository,
        }),
        seatManagementUseCase: new usecase_1.SeatManagementUseCase({
            seatRepository: repositories.seatRepository,
            showtimeRepository: repositories.showtimeRepository,
            partnerRepository: repositories.partnerRepository,
        }),
        ticketCheckInUseCase: new usecase_1.TicketCheckInUseCase({
            ticketRepository: repositories.ticketRepository,
            checkInRepository: repositories.checkInRepository,
            seatRepository: repositories.seatRepository,
            partnerRepository: repositories.partnerRepository,
        }),
        partnerFinanceUseCase: new usecase_1.PartnerFinanceUseCase({
            walletRepository: repositories.walletRepository,
            transactionRepository: repositories.transactionRepository,
            withdrawalRepository: repositories.withdrawalRepository,
            ticketRepository: repositories.ticketRepository,
            movieRepository: repositories.movieRepository,
            partnerRepository: repositories.partnerRepository,
        }),
        partnerDashboardUseCase: new usecase_1.PartnerDashboardUseCase({
            walletRepository: repositories.walletRepository,
            ticketRepository: repositories.ticketRepository,
            movieRepository: repositories.movieRepository,
            showtimeRepository: repositories.showtimeRepository,
            partnerRepository: repositories.partnerRepository,
        }),
    };
    return {
        router: setupPartnerHexagon(prisma),
        repositories,
        useCases,
    };
}
