"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAdminPartnerHexagon = exports.setupUserPartnerHexagon = exports.setupPartnerHexagon = exports.buildPartnerRequestAdminRouter = exports.buildPartnerRequestUserRouter = void 0;
exports.default = buildPartnerRouter;
const express_1 = require("express");
const auth_1 = require("../../share/middleware/auth");
const middleware_1 = require("./shared/middleware");
const repo_1 = require("./infras/repository/repo");
const partner_request_repo_1 = require("./infras/repository/partner-request-repo");
const services_repo_1 = require("./infras/repository/services.repo");
const usecase_1 = require("./usecase");
const service_usecase_1 = require("./usecase/service.usecase");
const profile_http_service_1 = require("./infras/transport/profile.http-service");
const movie_http_service_1 = require("./infras/transport/movie.http-service");
const http_server_1 = require("../../share/transport/http-server");
const showtime_http_service_1 = require("./infras/transport/showtime.http-service");
const room_http_services_1 = require("./infras/transport/room.http-services");
const seat_http_services_1 = require("./infras/transport/seat.http-services");
const ticket_http_service_1 = require("./infras/transport/ticket.http-service");
const finance_http_service_1 = require("./infras/transport/finance.http-service");
const dashboard_http_service_1 = require("./infras/transport/dashboard.http-service");
const partner_request_http_service_1 = require("./infras/transport/partner-request.http-service");
const service_http_services_1 = require("./infras/transport/service-http-services");
const notification_1 = require("./shared/notification");
const session_repo_1 = require("../user/infras/repository/session-repo");
const user_repo_1 = require("../user/infras/repository/user-repo");
const buildPartnerRequestUserRouter = (prisma) => {
    const router = (0, express_1.Router)();
    const partnerRepo = (0, repo_1.createPartnerRepository)(prisma);
    const userRepository = (0, user_repo_1.createUserRepository)(prisma);
    const sessionRepository = (0, session_repo_1.createSessionRepository)(prisma);
    const walletRepo = (0, repo_1.createWalletRepository)(prisma);
    const staffRepo = (0, repo_1.createStaffRepository)(prisma);
    const requestRepo = (0, partner_request_repo_1.createPartnerRequestRepository)(prisma);
    const requestUseCase = new usecase_1.RequestUseCase(requestRepo, partnerRepo, userRepository, sessionRepository, walletRepo, staffRepo);
    const service = new partner_request_http_service_1.PartnerRequestHttpService(requestUseCase);
    const guard = [auth_1.authMiddleware, auth_1.requireActiveUser];
    router.post("/partner-request", ...guard, (req, res) => service.submit(req, res));
    router.patch("/partner-request", ...guard, (req, res) => service.editSubmit(req, res));
    router.get("/partner-request", ...guard, (req, res) => service.getMyRequest(req, res));
    return router;
};
exports.buildPartnerRequestUserRouter = buildPartnerRequestUserRouter;
const buildPartnerRequestAdminRouter = (prisma) => {
    const router = (0, express_1.Router)();
    const partnerRepo = (0, repo_1.createPartnerRepository)(prisma);
    const movieRepo = (0, repo_1.createMovieRepository)(prisma);
    const serviceRepo = (0, services_repo_1.createServerRepository)(prisma);
    const userRepository = (0, user_repo_1.createUserRepository)(prisma);
    const sessionRepository = (0, session_repo_1.createSessionRepository)(prisma);
    const walletRepo = (0, repo_1.createWalletRepository)(prisma);
    const staffRepo = (0, repo_1.createStaffRepository)(prisma);
    const requestRepo = (0, partner_request_repo_1.createPartnerRequestRepository)(prisma);
    const requestUseCase = new usecase_1.RequestUseCase(requestRepo, partnerRepo, userRepository, sessionRepository, walletRepo, staffRepo);
    const profileUC = new usecase_1.PartnerProfileUseCase(partnerRepo);
    const movieUC = new usecase_1.MovieManagementUseCase(partnerRepo, movieRepo);
    const requestSvc = new partner_request_http_service_1.PartnerRequestHttpService(requestUseCase);
    const profileSvc = new profile_http_service_1.PartnerProfileHttpService(profileUC);
    const movieSvc = new movie_http_service_1.MovieManagementHttpService(movieUC);
    const adminGuard = [auth_1.authMiddleware, (0, auth_1.requireRole)("ADMIN")];
    // ── Partner requests ──────────────────────────────────────────────────────
    router.get("/partner-requests", ...adminGuard, (req, res) => requestSvc.adminListRequests(req, res));
    router.get("/partner-requests/stats", ...adminGuard, (req, res) => requestSvc.stats(req, res));
    router.get("/partner-requests/:id", ...adminGuard, (req, res) => requestSvc.adminGetRequest(req, res));
    router.put("/partner-requests/:id/approve", ...adminGuard, (req, res) => requestSvc.adminApprove(req, res));
    router.put("/partner-requests/:id/reject", ...adminGuard, (req, res) => requestSvc.adminReject(req, res));
    router.put("/partner-requests/:id/reset", ...adminGuard, (req, res) => requestSvc.adminReset(req, res));
    // ── Admin movies ──────────────────────────────────────────────────────────
    router.get("/movies/stats", ...adminGuard, (req, res) => movieSvc.adminGetMovieStats(req, res));
    router.get("/movies", ...adminGuard, (req, res) => movieSvc.adminListMovies(req, res));
    router.put("/movies/:movieId/approve", ...adminGuard, (req, res) => movieSvc.adminApproveMovie(req, res));
    router.put("/movies/:movieId/reject", ...adminGuard, (req, res) => movieSvc.adminRejectMovie(req, res));
    // ── Admin partners (fee management) ───────────────────────────────────────
    router.get("/partners", ...adminGuard, async (req, res) => {
        try {
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 50;
            const partners = await partnerRepo.list({}, { page, limit });
            (0, http_server_1.successResponse)(res, { items: partners, total: partners.length }, "Partners retrieved");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, 500, error.message);
        }
    });
    router.put("/partners/:partnerId/commission", ...adminGuard, async (req, res) => {
        try {
            const { partnerId } = req.params;
            const { commissionRate } = req.body;
            if (commissionRate === undefined || typeof commissionRate !== "number") {
                return (0, http_server_1.errorResponse)(res, 400, "commissionRate (number) is required");
            }
            const updated = await profileUC.updateCommissionRate(String(partnerId), commissionRate);
            (0, http_server_1.successResponse)(res, updated, "Commission rate updated");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message);
        }
    });
    // ── Admin services ────────────────────────────────────────────────────────
    router.get("/services", ...adminGuard, async (req, res) => {
        try {
            const result = await serviceRepo.listAll({
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                keyword: req.query.keyword,
                category: req.query.category,
            });
            (0, http_server_1.successResponse)(res, result, "Services retrieved");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, 500, error.message);
        }
    });
    return router;
};
exports.buildPartnerRequestAdminRouter = buildPartnerRequestAdminRouter;
function buildPartnerRouter(prisma) {
    const router = (0, express_1.Router)();
    const partnerRepo = (0, repo_1.createPartnerRepository)(prisma);
    const movieRepo = (0, repo_1.createMovieRepository)(prisma);
    const showtimeRepo = (0, repo_1.createShowtimeRepository)(prisma);
    const roomRepo = (0, repo_1.createRoomRepository)(prisma);
    const seatRepo = (0, repo_1.createSeatRepository)(prisma);
    const ticketRepo = (0, repo_1.createTicketRepository)(prisma);
    const transactionRepo = (0, repo_1.createTransactionRepository)(prisma);
    const withdrawalRepo = (0, repo_1.createWithdrawalRepository)(prisma);
    const checkInRepo = (0, repo_1.createCheckInRepository)(prisma);
    const walletRepo = (0, repo_1.createWalletRepository)(prisma);
    const serviceRepo = (0, services_repo_1.createServerRepository)(prisma);
    const notificationService = new notification_1.PartnerNotificationService();
    const profileUC = new usecase_1.PartnerProfileUseCase(partnerRepo);
    const serviceUC = new service_usecase_1.ServicePartnerUser(serviceRepo);
    const movieUC = new usecase_1.MovieManagementUseCase(partnerRepo, movieRepo, showtimeRepo, seatRepo, roomRepo);
    const showtimeUC = new usecase_1.ShowtimeManagementUseCase(partnerRepo, movieRepo, showtimeRepo, seatRepo, ticketRepo, walletRepo, transactionRepo);
    const seatUC = new usecase_1.SeatManagementUseCase(showtimeRepo, seatRepo, movieRepo);
    const ticketUC = new usecase_1.TicketCheckInUseCase(ticketRepo, checkInRepo, showtimeRepo);
    const financeUC = new usecase_1.PartnerFinanceUseCase(walletRepo, transactionRepo, withdrawalRepo, partnerRepo, notificationService);
    const dashboardUC = new usecase_1.PartnerDashboardUseCase(walletRepo, transactionRepo, showtimeRepo, withdrawalRepo, ticketRepo);
    const profileSvc = new profile_http_service_1.PartnerProfileHttpService(profileUC);
    const movieSvc = new movie_http_service_1.MovieManagementHttpService(movieUC);
    const showtimeSvc = new showtime_http_service_1.ShowtimeManagementHttpService(showtimeUC);
    const roomSvc = new room_http_services_1.RoomManagementHttpService(roomRepo);
    const seatSvc = new seat_http_services_1.SeatManagementHttpService(seatUC);
    const ticketSvc = new ticket_http_service_1.TicketCheckInHttpService(ticketUC);
    const financeSvc = new finance_http_service_1.PartnerFinanceHttpService(financeUC);
    const dashboardSvc = new dashboard_http_service_1.PartnerDashboardHttpService(dashboardUC);
    const serviceSvc = new service_http_services_1.ServicesHttpService(serviceUC);
    const guard = [
        auth_1.authMiddleware,
        (0, auth_1.requireRole)("PARTNER", "ADMIN"),
        (0, middleware_1.resolvePartnerIdMiddleware)(partnerRepo),
    ];
    router.get("/me", ...guard, (req, res) => profileSvc.getProfile(req, res));
    router.put("/me", ...guard, (req, res) => profileSvc.updateProfile(req, res));
    router.get("/status", ...guard, (req, res) => profileSvc.getStatus(req, res));
    router.post("/movies", ...guard, (req, res) => movieSvc.createMovie(req, res));
    router.get("/movies", ...guard, (req, res) => movieSvc.getMovies(req, res));
    router.get("/movies/:movieId", ...guard, (req, res) => movieSvc.getMovieDetail(req, res));
    router.put("/movies/:movieId", ...guard, (req, res) => movieSvc.updateMovie(req, res));
    router.delete("/movies/:movieId", ...guard, (req, res) => movieSvc.deleteMovie(req, res));
    router.post("/movies/:movieId/submit", ...guard, (req, res) => movieSvc.submitMovie(req, res));
    router.post("/showtimes", ...guard, (req, res) => showtimeSvc.createShowtime(req, res));
    router.get("/showtimes", ...guard, (req, res) => showtimeSvc.getShowtimes(req, res));
    router.get("/showtimes/:showtimeId", ...guard, (req, res) => showtimeSvc.getShowtimeDetail(req, res));
    router.put("/showtimes/:showtimeId", ...guard, (req, res) => showtimeSvc.updateShowtime(req, res));
    router.delete("/showtimes/:showtimeId", ...guard, (req, res) => showtimeSvc.cancelShowtime(req, res));
    router.get("/showtimes/:showtimeId/seats", ...guard, (req, res) => seatSvc.getSeats(req, res));
    router.get("/showtimes/:showtimeId/seat-map", ...guard, (req, res) => seatSvc.getSeatMap(req, res));
    router.get("/showtimes/:showtimeId/check-ins", ...guard, (req, res) => ticketSvc.getCheckInHistory(req, res));
    router.put("/seats/:seatId", ...guard, (req, res) => seatSvc.updateSeat(req, res));
    router.get("/tickets", ...guard, (req, res) => ticketSvc.getTickets(req, res));
    router.get("/tickets/:ticketId", ...guard, (req, res) => ticketSvc.getTicketDetail(req, res));
    router.post("/tickets/check-in", ...guard, (req, res) => ticketSvc.checkIn(req, res));
    router.get("/wallet", ...guard, (req, res) => financeSvc.getWallet(req, res));
    router.get("/transactions", ...guard, (req, res) => financeSvc.getTransactions(req, res));
    router.get("/revenue", ...guard, (req, res) => financeSvc.getRevenue(req, res));
    router.post("/withdrawals", ...guard, (req, res) => financeSvc.createWithdrawal(req, res));
    router.get("/withdrawals", ...guard, (req, res) => financeSvc.getWithdrawals(req, res));
    router.get("/withdrawals/:withdrawalId", ...guard, (req, res) => financeSvc.getWithdrawalDetail(req, res));
    router.get("/dashboard", ...guard, (req, res) => dashboardSvc.getDashboard(req, res));
    router.get("/stats/top-movies", ...guard, (req, res) => dashboardSvc.getTopMovies(req, res));
    router.get("/stats/occupancy", ...guard, (req, res) => dashboardSvc.getOccupancy(req, res));
    router.post("/rooms", ...guard, (req, res) => roomSvc.createRoom(req, res));
    router.get("/rooms", ...guard, (req, res) => roomSvc.getRooms(req, res));
    router.get("/rooms/:roomId", ...guard, (req, res) => roomSvc.getRoomDetail(req, res));
    router.put("/rooms/:roomId", ...guard, (req, res) => roomSvc.updateRoom(req, res));
    router.delete("/rooms/:roomId", ...guard, (req, res) => roomSvc.deleteRoom(req, res));
    router.get("/services", ...guard, (req, res) => serviceSvc.list(req, res));
    router.get("/services/search", ...guard, (req, res) => serviceSvc.findByCond(req, res));
    router.get("/services/:id", ...guard, (req, res) => serviceSvc.findById(req, res));
    router.post("/services", ...guard, (req, res) => serviceSvc.create(req, res));
    router.put("/services/:id", ...guard, (req, res) => serviceSvc.update(req, res));
    router.delete("/services/:id", ...guard, (req, res) => serviceSvc.delete(req, res));
    return router;
}
const setupPartnerHexagon = (prisma) => buildPartnerRouter(prisma);
exports.setupPartnerHexagon = setupPartnerHexagon;
const setupUserPartnerHexagon = (prisma) => (0, exports.buildPartnerRequestUserRouter)(prisma);
exports.setupUserPartnerHexagon = setupUserPartnerHexagon;
const setupAdminPartnerHexagon = (prisma) => (0, exports.buildPartnerRequestAdminRouter)(prisma);
exports.setupAdminPartnerHexagon = setupAdminPartnerHexagon;
