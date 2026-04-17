import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import {
  authMiddleware,
  requireActiveUser,
  requireRole,
} from "../../share/middleware/auth";
import { resolvePartnerIdMiddleware } from "./shared/middleware";
import {
  createPartnerRepository,
  createMovieRepository,
  createShowtimeRepository,
  createSeatRepository,
  createTicketRepository,
  createTransactionRepository,
  createWithdrawalRepository,
  createCheckInRepository,
  createWalletRepository,
  createStaffRepository,
} from "./infras/repository/repo";
import { createPartnerRequestRepository } from "./infras/repository/partner-request-repo";
import { createServerRepository } from "./infras/repository/services.repo";
import {
  PartnerProfileUseCase,
  RequestUseCase,
  MovieManagementUseCase,
  ShowtimeManagementUseCase,
  SeatManagementUseCase,
  TicketCheckInUseCase,
  PartnerFinanceUseCase,
  PartnerDashboardUseCase,
} from "./usecase";
import { ServicePartnerUser } from "./usecase/service.usecase";
import { PartnerProfileHttpService } from "./infras/transport/profile.http-service";
import { MovieManagementHttpService } from "./infras/transport/movie.http-service";
import { ShowtimeManagementHttpService } from "./infras/transport/showtime.http-service";
import { SeatManagementHttpService } from "./infras/transport/seat.http-services";
import { TicketCheckInHttpService } from "./infras/transport/ticket.http-service";
import { PartnerFinanceHttpService } from "./infras/transport/finance.http-service";
import { PartnerDashboardHttpService } from "./infras/transport/dashboard.http-service";
import { PartnerRequestHttpService } from "./infras/transport/partner-request.http-service";
import { ServicesHttpService } from "./infras/transport/service-http-services";
import { PartnerNotificationService } from "./shared/notification";
import { createSessionRepository } from "../user/infras/repository/session-repo";
import { createUserRepository } from "../user/infras/repository/user-repo";

export const buildPartnerRequestUserRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const partnerRepo = createPartnerRepository(prisma);
  const userRepository = createUserRepository(prisma);
  const sessionRepository = createSessionRepository(prisma);
  const walletRepo = createWalletRepository(prisma);
  const staffRepo = createStaffRepository(prisma);
  const requestRepo = createPartnerRequestRepository(prisma);

  const requestUseCase = new RequestUseCase(
    requestRepo,
    partnerRepo,
    userRepository,
    sessionRepository,
    walletRepo,
    staffRepo,
  );

  const service = new PartnerRequestHttpService(requestUseCase);

  const guard = [authMiddleware, requireActiveUser];

  router.post("/partner-request", ...guard, (req, res) => service.submit(req, res));
  router.patch("/partner-request", ...guard, (req, res) => service.editSubmit(req, res));
  router.get("/partner-request", ...guard, (req, res) => service.getMyRequest(req, res));

  return router;
};

export const buildPartnerRequestAdminRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const partnerRepo = createPartnerRepository(prisma);
  const userRepository = createUserRepository(prisma);
  const sessionRepository = createSessionRepository(prisma);
  const walletRepo = createWalletRepository(prisma);
  const staffRepo = createStaffRepository(prisma);
  const requestRepo = createPartnerRequestRepository(prisma);

  const requestUseCase = new RequestUseCase(
    requestRepo,
    partnerRepo,
    userRepository,
    sessionRepository,
    walletRepo,
    staffRepo,
  );

  const service = new PartnerRequestHttpService(requestUseCase);

  const adminGuard = [authMiddleware, requireRole("ADMIN")];

  router.get("/partner-requests", ...adminGuard, (req, res) => service.adminListRequests(req, res));
  router.get("/partner-requests/:id", ...adminGuard, (req, res) => service.adminGetRequest(req, res), );
  router.put("/partner-requests/:id/approve", ...adminGuard, (req, res) => service.adminApprove(req, res), ); 
  router.put("/partner-requests/:id/reject", ...adminGuard, (req, res) => service.adminReject(req, res), );

  return router;
};

export default function buildPartnerRouter(prisma: PrismaClient): Router {
  const router = Router();

  const partnerRepo = createPartnerRepository(prisma);
  const movieRepo = createMovieRepository(prisma);
  const showtimeRepo = createShowtimeRepository(prisma);
  const seatRepo = createSeatRepository(prisma);
  const ticketRepo = createTicketRepository(prisma);
  const transactionRepo = createTransactionRepository(prisma);
  const withdrawalRepo = createWithdrawalRepository(prisma);
  const checkInRepo = createCheckInRepository(prisma);
  const walletRepo = createWalletRepository(prisma);
  const serviceRepo = createServerRepository(prisma);

  const notificationService = new PartnerNotificationService();

  const profileUC = new PartnerProfileUseCase(partnerRepo);
  const serviceUC = new ServicePartnerUser(serviceRepo);
  const movieUC = new MovieManagementUseCase(partnerRepo, movieRepo);
  const showtimeUC = new ShowtimeManagementUseCase(
    partnerRepo,
    movieRepo,
    showtimeRepo,
    seatRepo,
    ticketRepo,
    walletRepo,
    transactionRepo,
  );
  const seatUC = new SeatManagementUseCase(showtimeRepo, seatRepo, movieRepo);
  const ticketUC = new TicketCheckInUseCase(ticketRepo, checkInRepo, showtimeRepo);
  const financeUC = new PartnerFinanceUseCase(
    walletRepo,
    transactionRepo,
    withdrawalRepo,
    partnerRepo,
    notificationService,
  );
  const dashboardUC = new PartnerDashboardUseCase(
    walletRepo,
    transactionRepo,
    showtimeRepo,
    withdrawalRepo,
    ticketRepo,
  );

  const profileSvc = new PartnerProfileHttpService(profileUC);
  const movieSvc = new MovieManagementHttpService(movieUC);
  const showtimeSvc = new ShowtimeManagementHttpService(showtimeUC);
  const seatSvc = new SeatManagementHttpService(seatUC);
  const ticketSvc = new TicketCheckInHttpService(ticketUC);
  const financeSvc = new PartnerFinanceHttpService(financeUC);
  const dashboardSvc = new PartnerDashboardHttpService(dashboardUC);
  const serviceSvc = new ServicesHttpService(serviceUC);
  const guard = [
    authMiddleware,
    requireRole("PARTNER", "ADMIN"),
    resolvePartnerIdMiddleware(partnerRepo),
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
  router.get("/showtimes/:showtimeId/check-ins", ...guard, (req, res) => ticketSvc.getCheckInHistory(req, res), ); 
  router.put("/seats/:seatId", ...guard, (req, res) => seatSvc.updateSeat(req, res)); 
  router.get("/tickets", ...guard, (req, res) => ticketSvc.getTickets(req, res)); 
  router.get("/tickets/:ticketId", ...guard, (req, res) => ticketSvc.getTicketDetail(req, res)); 
  router.post("/tickets/check-in", ...guard, (req, res) => ticketSvc.checkIn(req, res)); 
  router.get("/wallet", ...guard, (req, res) => financeSvc.getWallet(req, res)); 
  router.get("/transactions", ...guard, (req, res) => financeSvc.getTransactions(req, res)); 
  router.get("/revenue", ...guard, (req, res) => financeSvc.getRevenue(req, res)); 
  router.post("/withdrawals", ...guard, (req, res) => financeSvc.createWithdrawal(req, res)); 
  router.get("/withdrawals", ...guard, (req, res) => financeSvc.getWithdrawals(req, res)); 
  router.get("/withdrawals/:withdrawalId", ...guard, (req, res) => financeSvc.getWithdrawalDetail(req, res), ); 
  router.get("/dashboard", ...guard, (req, res) => dashboardSvc.getDashboard(req, res)); 
  router.get("/stats/top-movies", ...guard, (req, res) => dashboardSvc.getTopMovies(req, res)); 
  router.get("/stats/occupancy", ...guard, (req, res) => dashboardSvc.getOccupancy(req, res)); 
  router.get("/rooms", ...guard, (req, res) => ticketSvc.getTickets(req, res)); 
  router.post("/rooms", ...guard, (req, res) => ticketSvc.getTickets(req, res)); 
  router.get("/rooms/:ticketId", ...guard, (req, res) => ticketSvc.getTicketDetail(req, res)); 
  router.put("/rooms/:ticketId", ...guard, (req, res) => ticketSvc.getTicketDetail(req, res)); 
  router.delete("/rooms/:ticketId", ...guard, (req, res) => ticketSvc.getTicketDetail(req, res)); 
  router.get("/services", ...guard, (req, res) => serviceSvc.list(req, res)); 
  router.get("/services/search", ...guard, (req, res) => serviceSvc.findByCond(req, res)); 
  router.get("/services/:id", ...guard, (req, res) => serviceSvc.findById(req, res)); 
  router.post("/services", ...guard, (req, res) => serviceSvc.create(req, res)); 
  router.put("/services/:id", ...guard, (req, res) => serviceSvc.update(req, res)); 
  router.delete("/services/:id", ...guard, (req, res) => serviceSvc.delete(req, res));

  return router;
}


export const setupPartnerHexagon = (prisma: PrismaClient) => buildPartnerRouter(prisma);
export const setupUserPartnerHexagon = (prisma: PrismaClient) => buildPartnerRequestUserRouter(prisma);
export const setupAdminPartnerHexagon = (prisma: PrismaClient) => buildPartnerRequestAdminRouter(prisma);
