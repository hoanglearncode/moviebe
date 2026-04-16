import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../../share/transport/http-server";
import {
  IPartnerProfileUseCase,
  IMovieManagementUseCase,
  IShowtimeManagementUseCase,
  ISeatManagementUseCase,
  ITicketCheckInUseCase,
  IPartnerFinanceUseCase,
  IPartnerDashboardUseCase,
  IPartnerServicesUseCase,
} from "../../interface";
import {
  UpdatePartnerDTO,
  CreateMovieDTO,
  UpdateMovieDTO,
  CreateShowtimeDTO,
  UpdateShowtimeDTO,
  UpdateSeatDTO,
  CheckInDTO,
  CreateWithdrawalDTO,
  ListMoviesQueryDTO,
  ListShowtimesQueryDTO,
  ListTicketsQueryDTO,
  ListWithdrawalsQueryDTO,
  RevenueQueryDTO,
} from "../../model/dto";

/**
 * ==========================================
 * PARTNER PROFILE HTTP SERVICE
 * ==========================================
 */

export class PartnerProfileHttpService {
  constructor(private useCase: IPartnerProfileUseCase) {}

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const profile = await this.useCase.getProfile(partnerId);
      successResponse(res, profile, "Profile retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const data: UpdatePartnerDTO = req.body;
      const updated = await this.useCase.updateProfile(partnerId, data);
      successResponse(res, updated, "Profile updated successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const status = await this.useCase.getStatus(partnerId);
      successResponse(res, status, "Status retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }
}

/**
 * ==========================================
 * MOVIE MANAGEMENT HTTP SERVICE
 * ==========================================
 */

export class MovieManagementHttpService {
  constructor(private useCase: IMovieManagementUseCase) {}

  async createMovie(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const data: CreateMovieDTO = req.body;
      const result = await this.useCase.createMovie(partnerId, data);
      successResponse(res, result, "Movie created successfully", 201);
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async getMovies(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const query: ListMoviesQueryDTO = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        status: req.query.status as any,
        keyword: req.query.keyword as string,
        sortBy: (req.query.sortBy as "createdAt" | "title" | "releaseDate") || "createdAt",
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      };

      const result = await this.useCase.getMovies(partnerId, query);
      successResponse(res, result, "Movies retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async getMovieDetail(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { movieId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const movie = await this.useCase.getMovieDetail(partnerId, String(movieId));
      successResponse(res, movie, "Movie retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 404, error.message, error.code);
    }
  }

  async updateMovie(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { movieId } = req.params;
      const data: UpdateMovieDTO = req.body;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const updated = await this.useCase.updateMovie(partnerId, String(movieId), data);
      successResponse(res, updated, "Movie updated successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async deleteMovie(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { movieId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const result = await this.useCase.deleteMovie(partnerId, String(movieId));
      successResponse(res, result, "Movie deleted successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async submitMovie(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { movieId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const result = await this.useCase.submitMovieForApproval(partnerId, String(movieId));
      successResponse(res, result, "Movie submitted for approval");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }
}

/**
 * ==========================================
 * SHOWTIME MANAGEMENT HTTP SERVICE
 * ==========================================
 */

export class ShowtimeManagementHttpService {
  constructor(private useCase: IShowtimeManagementUseCase) {}

  async createShowtime(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const data: CreateShowtimeDTO = req.body;
      const result = await this.useCase.createShowtime(partnerId, data);
      successResponse(res, result, "Showtime created successfully", 201);
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async getShowtimes(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const query: ListShowtimesQueryDTO = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        movieId: req.query.movieId as string,
        startDate: req.query.startDate as any,
        endDate: req.query.endDate as any,
        status: req.query.status as any,
        sortBy: (req.query.sortBy as "startTime" | "createdAt") || "startTime",
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "asc",
      };

      const result = await this.useCase.getShowtimes(partnerId, query);
      successResponse(res, result, "Showtimes retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async getShowtimeDetail(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { showtimeId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const showtime = await this.useCase.getShowtimeDetail(partnerId, String(showtimeId));
      successResponse(res, showtime, "Showtime retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 404, error.message, error.code);
    }
  }

  async updateShowtime(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { showtimeId } = req.params;
      const data: UpdateShowtimeDTO = req.body;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const updated = await this.useCase.updateShowtime(partnerId, String(showtimeId), data);
      successResponse(res, updated, "Showtime updated successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async cancelShowtime(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { showtimeId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const result = await this.useCase.cancelShowtime(partnerId, String(showtimeId));
      successResponse(res, result, "Showtime cancelled successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }
}

/**
 * ==========================================
 * SEAT MANAGEMENT HTTP SERVICE
 * ==========================================
 */

export class SeatManagementHttpService {
  constructor(private useCase: ISeatManagementUseCase) {}

  async getSeats(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { showtimeId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const seats = await this.useCase.getSeats(partnerId, String(showtimeId));
      successResponse(res, seats, "Seats retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async updateSeat(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { seatId } = req.params;
      const data: UpdateSeatDTO = req.body;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const updated = await this.useCase.updateSeat(partnerId, String(seatId), data);
      successResponse(res, updated, "Seat updated successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async getSeatMap(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { showtimeId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const seatMap = await this.useCase.getSeatMap(partnerId, String(showtimeId));
      successResponse(res, seatMap, "Seat map retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }
}

/**
 * ==========================================
 * TICKET & CHECK-IN HTTP SERVICE
 * ==========================================
 */

export class TicketCheckInHttpService {
  constructor(private useCase: ITicketCheckInUseCase) {}

  async getTickets(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const query: ListTicketsQueryDTO = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        showtimeId: req.query.showtimeId as string,
        status: req.query.status as any,
        startDate: req.query.startDate as any,
        endDate: req.query.endDate as any,
      };

      const result = await this.useCase.getTickets(partnerId, query);
      successResponse(res, result, "Tickets retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async getTicketDetail(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { ticketId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const ticket = await this.useCase.getTicketDetail(partnerId, String(ticketId));
      successResponse(res, ticket, "Ticket retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 404, error.message, error.code);
    }
  }

  async checkIn(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const data: CheckInDTO = req.body;
      const result = await this.useCase.checkInTicket(partnerId, data);
      successResponse(res, result, "Check-in successful");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async getCheckInHistory(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { showtimeId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const history = await this.useCase.getCheckInHistory(partnerId, String(showtimeId));
      successResponse(res, history, "Check-in history retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }
}

/**
 * ==========================================
 * FINANCE HTTP SERVICE
 * ==========================================
 */

export class PartnerFinanceHttpService {
  constructor(private useCase: IPartnerFinanceUseCase) {}

  async getWallet(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const wallet = await this.useCase.getWallet(partnerId);
      successResponse(res, wallet, "Wallet retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const transactions = await this.useCase.getTransactions(partnerId);
      successResponse(res, transactions, "Transactions retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async getRevenue(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const query: RevenueQueryDTO = {
        startDate: req.query.startDate as any,
        endDate: req.query.endDate as any,
        groupBy: (req.query.groupBy as any) || "DAY",
      };

      const revenue = await this.useCase.getRevenue(partnerId, query);
      successResponse(res, revenue, "Revenue retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async createWithdrawal(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const data: CreateWithdrawalDTO = req.body;
      const result = await this.useCase.createWithdrawal(partnerId, data);
      successResponse(res, result, "Withdrawal created successfully", 201);
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async getWithdrawals(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const query: ListWithdrawalsQueryDTO = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        status: req.query.status as any,
        startDate: req.query.startDate as any,
        endDate: req.query.endDate as any,
      };

      const result = await this.useCase.getWithdrawals(partnerId, query);
      successResponse(res, result, "Withdrawals retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async getWithdrawalDetail(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { withdrawalId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const withdrawal = await this.useCase.getWithdrawalDetail(partnerId, String(withdrawalId));
      successResponse(res, withdrawal, "Withdrawal retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 404, error.message, error.code);
    }
  }
}

/**
 * ==========================================
 * DASHBOARD HTTP SERVICE
 * ==========================================
 */

export class PartnerDashboardHttpService {
  constructor(private useCase: IPartnerDashboardUseCase) {}

  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const stats = await this.useCase.getDashboardStats(partnerId);
      successResponse(res, stats, "Dashboard stats retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async getTopMovies(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const topMovies = await this.useCase.getTopMovies(partnerId, limit);
      successResponse(res, topMovies, "Top movies retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async getOccupancy(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await this.useCase.getOccupancyStats(partnerId, startDate, endDate);
      successResponse(res, stats, "Occupancy stats retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }
}
