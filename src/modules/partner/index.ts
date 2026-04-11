import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../../../../share/component/logger";
import { authMiddleware } from "../../../../share/transport/middleware";

// Repositories
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
} from "./repository/repo";

// Use Cases
import {
  PartnerProfileUseCase,
  MovieManagementUseCase,
  ShowtimeManagementUseCase,
  SeatManagementUseCase,
  TicketCheckInUseCase,
  PartnerFinanceUseCase,
  PartnerDashboardUseCase,
} from "./usecase";

// HTTP Services
import {
  PartnerProfileHttpService,
  MovieManagementHttpService,
  ShowtimeManagementHttpService,
  SeatManagementHttpService,
  TicketCheckInHttpService,
  PartnerFinanceHttpService,
  PartnerDashboardHttpService,
} from "./transport/http-service";

// DTOs & Validation
import {
  UpdatePartnerDTO,
  CreateMovieDTO,
  UpdateMovieDTO,
  CreateShowtimeDTO,
  UpdateShowtimeDTO,
  UpdateSeatDTO,
  CheckInDTO,
  CreateWithdrawalDTO,
} from "./model/dto";

/**
 * Partners access control middleware
 * Verifies user has PARTNER or ADMIN role
 */
function requirePartnerRole(req: Request, res: Response, next: Function) {
  const user = (req as any).user;
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
export function setupPartnerHexagon(prisma: PrismaClient): Router {
  logger.info("Setting up Partner Hexagon");

  const router = Router();

  // =========================================
  // Repository Layer
  // =========================================
  const partnerRepository = createPartnerRepository(prisma);
  const movieRepository = createMovieRepository(prisma);
  const showtimeRepository = createShowtimeRepository(prisma);
  const seatRepository = createSeatRepository(prisma);
  const ticketRepository = createTicketRepository(prisma);
  const transactionRepository = createTransactionRepository(prisma);
  const withdrawalRepository = createWithdrawalRepository(prisma);
  const checkInRepository = createCheckInRepository(prisma);
  const walletRepository = createWalletRepository(prisma);

  // =========================================
  // Use Case Layer
  // =========================================
  const partnerProfileUseCase = new PartnerProfileUseCase({
    partnerRepository,
  });

  const movieManagementUseCase = new MovieManagementUseCase({
    movieRepository,
    partnerRepository,
    seatRepository,
  });

  const showtimeManagementUseCase = new ShowtimeManagementUseCase({
    showtimeRepository,
    movieRepository,
    partnerRepository,
    seatRepository,
  });

  const seatManagementUseCase = new SeatManagementUseCase({
    seatRepository,
    showtimeRepository,
    partnerRepository,
  });

  const ticketCheckInUseCase = new TicketCheckInUseCase({
    ticketRepository,
    checkInRepository,
    seatRepository,
    partnerRepository,
  });

  const partnerFinanceUseCase = new PartnerFinanceUseCase({
    walletRepository,
    transactionRepository,
    withdrawalRepository,
    ticketRepository,
    movieRepository,
    partnerRepository,
  });

  const partnerDashboardUseCase = new PartnerDashboardUseCase({
    walletRepository,
    ticketRepository,
    movieRepository,
    showtimeRepository,
    partnerRepository,
  });

  // =========================================
  // HTTP Service Layer
  // =========================================
  const partnerProfileHttpService = new PartnerProfileHttpService(partnerProfileUseCase);
  const movieHttpService = new MovieManagementHttpService(movieManagementUseCase);
  const showtimeHttpService = new ShowtimeManagementHttpService(showtimeManagementUseCase);
  const seatHttpService = new SeatManagementHttpService(seatManagementUseCase);
  const ticketHttpService = new TicketCheckInHttpService(ticketCheckInUseCase);
  const financeHttpService = new PartnerFinanceHttpService(partnerFinanceUseCase);
  const dashboardHttpService = new PartnerDashboardHttpService(partnerDashboardUseCase);

  // =========================================
  // Middleware Stack
  // =========================================
  router.use(authMiddleware);
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
  router.get("/showtimes/:showtimeId", (req, res) =>
    showtimeHttpService.getShowtimeDetail(req, res),
  );
  router.put("/showtimes/:showtimeId", (req, res) => showtimeHttpService.updateShowtime(req, res));
  router.delete("/showtimes/:showtimeId", (req, res) =>
    showtimeHttpService.cancelShowtime(req, res),
  );

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
  router.get("/showtimes/:showtimeId/check-ins", (req, res) =>
    ticketHttpService.getCheckInHistory(req, res),
  );

  // =========================================
  // Finance Routes
  // =========================================
  router.get("/wallet", (req, res) => financeHttpService.getWallet(req, res));
  router.get("/transactions", (req, res) => financeHttpService.getTransactions(req, res));
  router.get("/revenue", (req, res) => financeHttpService.getRevenue(req, res));
  router.post("/withdrawals", (req, res) => financeHttpService.createWithdrawal(req, res));
  router.get("/withdrawals", (req, res) => financeHttpService.getWithdrawals(req, res));
  router.get("/withdrawals/:withdrawalId", (req, res) =>
    financeHttpService.getWithdrawalDetail(req, res),
  );

  // =========================================
  // Dashboard Routes
  // =========================================
  router.get("/dashboard", (req, res) => dashboardHttpService.getDashboard(req, res));
  router.get("/stats/top-movies", (req, res) => dashboardHttpService.getTopMovies(req, res));
  router.get("/stats/occupancy", (req, res) => dashboardHttpService.getOccupancy(req, res));

  logger.info("Partner Hexagon setup completed");

  return router;
}

/**
 * Export using the setupUserHexagon pattern for consistency
 * setupPartnerHexagonWithUseCase can be used when you need direct use case access
 */
export function setupPartnerHexagonWithUseCase(prisma: PrismaClient) {
  const repositories = {
    partnerRepository: createPartnerRepository(prisma),
    movieRepository: createMovieRepository(prisma),
    showtimeRepository: createShowtimeRepository(prisma),
    seatRepository: createSeatRepository(prisma),
    ticketRepository: createTicketRepository(prisma),
    transactionRepository: createTransactionRepository(prisma),
    withdrawalRepository: createWithdrawalRepository(prisma),
    checkInRepository: createCheckInRepository(prisma),
    walletRepository: createWalletRepository(prisma),
  };

  const useCases = {
    partnerProfileUseCase: new PartnerProfileUseCase({
      partnerRepository: repositories.partnerRepository,
    }),
    movieManagementUseCase: new MovieManagementUseCase({
      movieRepository: repositories.movieRepository,
      partnerRepository: repositories.partnerRepository,
      seatRepository: repositories.seatRepository,
    }),
    showtimeManagementUseCase: new ShowtimeManagementUseCase({
      showtimeRepository: repositories.showtimeRepository,
      movieRepository: repositories.movieRepository,
      partnerRepository: repositories.partnerRepository,
      seatRepository: repositories.seatRepository,
    }),
    seatManagementUseCase: new SeatManagementUseCase({
      seatRepository: repositories.seatRepository,
      showtimeRepository: repositories.showtimeRepository,
      partnerRepository: repositories.partnerRepository,
    }),
    ticketCheckInUseCase: new TicketCheckInUseCase({
      ticketRepository: repositories.ticketRepository,
      checkInRepository: repositories.checkInRepository,
      seatRepository: repositories.seatRepository,
      partnerRepository: repositories.partnerRepository,
    }),
    partnerFinanceUseCase: new PartnerFinanceUseCase({
      walletRepository: repositories.walletRepository,
      transactionRepository: repositories.transactionRepository,
      withdrawalRepository: repositories.withdrawalRepository,
      ticketRepository: repositories.ticketRepository,
      movieRepository: repositories.movieRepository,
      partnerRepository: repositories.partnerRepository,
    }),
    partnerDashboardUseCase: new PartnerDashboardUseCase({
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
