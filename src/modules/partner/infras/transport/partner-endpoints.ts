import { PrismaClient } from "@prisma/client";
import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware, requireRole } from "../../../../share/middleware/auth";
import { errorResponse } from "../../../../share/transport/http-server";
import {
  PartnerProfileHttpService,
  MovieManagementHttpService,
  ShowtimeManagementHttpService,
  SeatManagementHttpService,
  TicketCheckInHttpService,
  PartnerFinanceHttpService,
  PartnerDashboardHttpService,
} from "./http-service";
import {
  PartnerProfileUseCase,
  MovieManagementUseCase,
  ShowtimeManagementUseCase,
  SeatManagementUseCase,
  TicketCheckInUseCase,
  PartnerFinanceUseCase,
  PartnerDashboardUseCase,
} from "../../usecase";
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
} from "../repository/repo";
import { PartnerNotificationService } from "../../shared/notification";

function resolvePartnerIdMiddleware(partnerRepo: ReturnType<typeof createPartnerRepository>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        errorResponse(res, 401, "Unauthorized");
        return;
      }

      const partner = await partnerRepo.findByUserId(userId);
      if (!partner) {
        errorResponse(res, 404, "Partner profile not found for this user");
        return;
      }

      (req as any).partnerId = partner.id;
      next();
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  };
}

export default function buildPartnerRouter(prisma: PrismaClient): Router {
  const partnerRepository = createPartnerRepository(prisma);
  const movieRepository = createMovieRepository(prisma);
  const showtimeRepository = createShowtimeRepository(prisma);
  const seatRepository = createSeatRepository(prisma);
  const ticketRepository = createTicketRepository(prisma);
  const transactionRepository = createTransactionRepository(prisma);
  const withdrawalRepository = createWithdrawalRepository(prisma);
  const checkInRepository = createCheckInRepository(prisma);
  const walletRepository = createWalletRepository(prisma);
  const notificationService = new PartnerNotificationService();

  const profileUseCase = new PartnerProfileUseCase(partnerRepository);
  const movieUseCase = new MovieManagementUseCase(partnerRepository, movieRepository);
  const showtimeUseCase = new ShowtimeManagementUseCase(
    partnerRepository,
    movieRepository,
    showtimeRepository,
    seatRepository,
    ticketRepository,
    walletRepository,
    transactionRepository,
  );
  const seatUseCase = new SeatManagementUseCase(
    showtimeRepository,
    seatRepository,
    movieRepository,
  );
  const ticketUseCase = new TicketCheckInUseCase(
    ticketRepository,
    checkInRepository,
    showtimeRepository,
  );
  const financeUseCase = new PartnerFinanceUseCase(
    walletRepository,
    transactionRepository,
    withdrawalRepository,
    partnerRepository,
    notificationService,
  );
  const dashboardUseCase = new PartnerDashboardUseCase(
    walletRepository,
    transactionRepository,
    showtimeRepository,
    withdrawalRepository,
    ticketRepository,
  );

  const profileSvc = new PartnerProfileHttpService(profileUseCase);
  const movieSvc = new MovieManagementHttpService(movieUseCase);
  const showtimeSvc = new ShowtimeManagementHttpService(showtimeUseCase);
  const seatSvc = new SeatManagementHttpService(seatUseCase);
  const ticketSvc = new TicketCheckInHttpService(ticketUseCase);
  const financeSvc = new PartnerFinanceHttpService(financeUseCase);
  const dashboardSvc = new PartnerDashboardHttpService(dashboardUseCase);

  const router = Router();
  const guard = [
    authMiddleware,
    requireRole("PARTNER", "ADMIN"),
    resolvePartnerIdMiddleware(partnerRepository),
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

  return router;
}
