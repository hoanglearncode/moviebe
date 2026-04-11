import { v7 } from "uuid";
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from "../../../share/transport/http-server";
import { ErrorCode } from "../../../share/model/error-code";
import { logger } from "../../system/logger";
import {
  PartnerHexagonDependencies,
  IPartnerProfileUseCase,
  IMovieManagementUseCase,
  IShowtimeManagementUseCase,
  ISeatManagementUseCase,
  ITicketCheckInUseCase,
  IPartnerFinanceUseCase,
  IPartnerDashboardUseCase,
} from "../interface";
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
  UpdatePartnerPayloadDTO,
  CreateMoviePayloadDTO,
  UpdateMoviePayloadDTO,
  CreateShowtimePayloadDTO,
  UpdateShowtimePayloadDTO,
  UpdateSeatPayloadDTO,
  CheckInPayloadDTO,
  CreateWithdrawalPayloadDTO,
} from "../model/dto";
import {
  PartnerProfile,
  Movie,
  Showtime,
  Seat,
  Ticket,
  CheckIn,
  PartnerWallet,
  Withdrawal,
  SeatType,
  SeatStatus,
  WithdrawalStatus,
} from "../model/model";

/**
 * ==========================================
 * PARTNER PROFILE USE CASE
 * ==========================================
 */

export class PartnerProfileUseCase implements IPartnerProfileUseCase {
  constructor(private readonly dependencies: PartnerHexagonDependencies) {}

  async getProfile(partnerId: string): Promise<PartnerProfile> {
    if (!partnerId) {
      throw new ValidationError("Partner ID is required");
    }

    const partner = await this.dependencies.partnerRepository.findById(partnerId);
    if (!partner) {
      throw new NotFoundError("Partner not found");
    }

    return partner;
  }

  async updateProfile(partnerId: string, data: UpdatePartnerDTO): Promise<PartnerProfile> {
    if (!partnerId) {
      throw new ValidationError("Partner ID is required");
    }

    const parsed = UpdatePartnerPayloadDTO.safeParse(data);
    if (!parsed.success) {
      throw new ValidationError("Invalid update data", parsed.error.issues);
    }

    const partner = await this.dependencies.partnerRepository.findById(partnerId);
    if (!partner) {
      throw new NotFoundError("Partner not found");
    }

    await this.dependencies.partnerRepository.update(partnerId, parsed.data);
    logger.info(`[Partner] Updated profile for partner ${partnerId}`);

    // Return updated partner object
    return {
      ...partner,
      ...parsed.data,
      updatedAt: new Date(),
    };
  }

  async getStatus(partnerId: string): Promise<{ status: string; approvedAt?: Date }> {
    if (!partnerId) {
      throw new ValidationError("Partner ID is required");
    }

    const partner = await this.dependencies.partnerRepository.findById(partnerId);
    if (!partner) {
      throw new NotFoundError("Partner not found");
    }

    return {
      status: partner.status,
      approvedAt: partner.approvedAt || undefined,
    };
  }
}

/**
 * ==========================================
 * MOVIE MANAGEMENT USE CASE
 * ==========================================
 */

export class MovieManagementUseCase implements IMovieManagementUseCase {
  constructor(private readonly dependencies: PartnerHexagonDependencies) {}

  async createMovie(partnerId: string, data: CreateMovieDTO): Promise<{ movieId: string }> {
    const parsed = CreateMoviePayloadDTO.safeParse(data);
    if (!parsed.success) {
      throw new ValidationError("Invalid movie data", parsed.error.issues);
    }

    // Verify partner exists
    const partner = await this.dependencies.partnerRepository.findById(partnerId);
    if (!partner) {
      throw new NotFoundError("Partner not found");
    }

    const movieId = v7();
    const newMovie: Movie = {
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
    logger.info(`[Movie] Created movie ${movieId} for partner ${partnerId}`);

    return { movieId };
  }

  async getMovies(partnerId: string, query: ListMoviesQueryDTO) {
    const partner = await this.dependencies.partnerRepository.findById(partnerId);
    if (!partner) {
      throw new NotFoundError("Partner not found");
    }

    return this.dependencies.movieRepository.findByPartnerId(partnerId, query);
  }

  async getMovieDetail(partnerId: string, movieId: string): Promise<Movie> {
    const movie = await this.dependencies.movieRepository.findByIdAndPartnerId(movieId, partnerId);
    if (!movie) {
      throw new NotFoundError("Movie not found");
    }

    return movie;
  }

  async updateMovie(partnerId: string, movieId: string, data: UpdateMovieDTO): Promise<Movie> {
    const parsed = UpdateMoviePayloadDTO.safeParse(data);
    if (!parsed.success) {
      throw new ValidationError("Invalid movie data", parsed.error.issues);
    }

    const movie = await this.dependencies.movieRepository.findByIdAndPartnerId(movieId, partnerId);
    if (!movie) {
      throw new NotFoundError("Movie not found");
    }

    // Can't update if already approved
    if (movie.status === "APPROVED" || movie.status === "ACTIVE") {
      throw new ValidationError("Cannot update published movie");
    }

    // Parse dates from string to Date if provided
    const updateData: any = { ...parsed.data };
    if (updateData.releaseDate && typeof updateData.releaseDate === "string") {
      updateData.releaseDate = new Date(updateData.releaseDate);
    }
    if (updateData.endDate && typeof updateData.endDate === "string") {
      updateData.endDate = new Date(updateData.endDate);
    }

    await this.dependencies.movieRepository.update(movieId, updateData);
    logger.info(`[Movie] Updated movie ${movieId}`);

    // Return updated movie
    return {
      ...movie,
      ...updateData,
      updatedAt: new Date(),
    } as Movie;
  }

  async deleteMovie(partnerId: string, movieId: string): Promise<{ message: string }> {
    const movie = await this.dependencies.movieRepository.findByIdAndPartnerId(movieId, partnerId);
    if (!movie) {
      throw new NotFoundError("Movie not found");
    }

    if (movie.status === "APPROVED" || movie.status === "ACTIVE") {
      throw new ValidationError("Cannot delete published movie");
    }

    await this.dependencies.movieRepository.delete(movieId, false);
    logger.info(`[Movie] Deleted movie ${movieId}`);

    return { message: "Movie deleted successfully" };
  }

  async submitMovieForApproval(partnerId: string, movieId: string): Promise<{ message: string }> {
    const movie = await this.dependencies.movieRepository.findByIdAndPartnerId(movieId, partnerId);
    if (!movie) {
      throw new NotFoundError("Movie not found");
    }

    if (movie.status !== "DRAFT") {
      throw new ValidationError("Only draft movies can be submitted");
    }

    await this.dependencies.movieRepository.updateStatus(movieId, "SUBMITTED");
    logger.info(`[Movie] Submitted movie ${movieId} for approval`);

    return { message: "Movie submitted for approval" };
  }
}

/**
 * ==========================================
 * SHOWTIME MANAGEMENT USE CASE
 * ==========================================
 */

export class ShowtimeManagementUseCase implements IShowtimeManagementUseCase {
  constructor(private readonly dependencies: PartnerHexagonDependencies) {}

  async createShowtime(
    partnerId: string,
    data: CreateShowtimeDTO,
  ): Promise<{ showtimeId: string }> {
    const parsed = CreateShowtimePayloadDTO.safeParse(data);
    if (!parsed.success) {
      throw new ValidationError("Invalid showtime data", parsed.error.issues);
    }

    // Verify movie belongs to partner
    const movie = await this.dependencies.movieRepository.findByIdAndPartnerId(
      parsed.data.movieId,
      partnerId,
    );
    if (!movie) {
      throw new NotFoundError("Movie not found");
    }

    if (movie.status !== "APPROVED" && movie.status !== "ACTIVE") {
      throw new ValidationError("Movie must be approved to create showtimes");
    }

    const startTime = new Date(parsed.data.startTime);
    const endTime = new Date(startTime.getTime() + (movie.duration + 15) * 60 * 1000); // +15 min buffer

    const showtimeId = v7();
    const newShowtime: Showtime = {
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

    logger.info(`[Showtime] Created showtime ${showtimeId} for movie ${movie.id}`);

    return { showtimeId };
  }

  async getShowtimes(partnerId: string, query: ListShowtimesQueryDTO) {
    const partner = await this.dependencies.partnerRepository.findById(partnerId);
    if (!partner) {
      throw new NotFoundError("Partner not found");
    }

    return this.dependencies.showtimeRepository.findByPartnerId(partnerId, query);
  }

  async getShowtimeDetail(partnerId: string, showtimeId: string): Promise<Showtime> {
    const showtime = await this.dependencies.showtimeRepository.findByIdAndPartnerId(
      showtimeId,
      partnerId,
    );
    if (!showtime) {
      throw new NotFoundError("Showtime not found");
    }

    return showtime;
  }

  async updateShowtime(
    partnerId: string,
    showtimeId: string,
    data: UpdateShowtimeDTO,
  ): Promise<Showtime> {
    const parsed = UpdateShowtimePayloadDTO.safeParse(data);
    if (!parsed.success) {
      throw new ValidationError("Invalid update data", parsed.error.issues);
    }

    const showtime = await this.dependencies.showtimeRepository.findByIdAndPartnerId(
      showtimeId,
      partnerId,
    );
    if (!showtime) {
      throw new NotFoundError("Showtime not found");
    }

    if (showtime.status !== "SCHEDULED") {
      throw new ValidationError("Can only update scheduled showtimes");
    }

    const updated = await this.dependencies.showtimeRepository.update(showtimeId, parsed.data);
    return updated;
  }

  async cancelShowtime(partnerId: string, showtimeId: string): Promise<{ message: string }> {
    const showtime = await this.dependencies.showtimeRepository.findByIdAndPartnerId(
      showtimeId,
      partnerId,
    );
    if (!showtime) {
      throw new NotFoundError("Showtime not found");
    }

    if (showtime.status === "ENDED" || showtime.status === "CANCELLED") {
      throw new ValidationError("Cannot cancel ended or already cancelled showtime");
    }

    await this.dependencies.showtimeRepository.updateStatus(showtimeId, "CANCELLED");
    logger.info(`[Showtime] Cancelled showtime ${showtimeId}`);

    return { message: "Showtime cancelled successfully" };
  }

  // Helper: Create seats for showtime
  private async createSeatsForShowtime(showtime: Showtime): Promise<void> {
    const rows = Math.ceil(Math.sqrt(showtime.totalSeats));
    const cols = Math.ceil(showtime.totalSeats / rows);
    let seatCount = 0;

    const seats: Seat[] = [];
    for (let row = 0; row < rows && seatCount < showtime.totalSeats; row++) {
      for (let col = 0; col < cols && seatCount < showtime.totalSeats; col++) {
        const rowLetter = String.fromCharCode(65 + row); // A, B, C...
        const seatNumber = `${rowLetter}${col + 1}`;

        seats.push({
          id: v7(),
          showtimeId: showtime.id,
          seatNumber,
          seatType: SeatType.STANDARD,
          status: SeatStatus.AVAILABLE,
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

/**
 * ==========================================
 * SEAT MANAGEMENT USE CASE
 * ==========================================
 */

export class SeatManagementUseCase implements ISeatManagementUseCase {
  constructor(private readonly dependencies: PartnerHexagonDependencies) {}

  async getSeats(partnerId: string, showtimeId: string): Promise<Seat[]> {
    // Verify ownership
    const showtime = await this.dependencies.showtimeRepository.findByIdAndPartnerId(
      showtimeId,
      partnerId,
    );
    if (!showtime) {
      throw new NotFoundError("Showtime not found");
    }

    return this.dependencies.seatRepository.findByShowtimeId(showtimeId);
  }

  async updateSeat(partnerId: string, seatId: string, data: UpdateSeatDTO): Promise<Seat> {
    const parsed = UpdateSeatPayloadDTO.safeParse(data);
    if (!parsed.success) {
      throw new ValidationError("Invalid seat data", parsed.error.issues);
    }

    const seat = await this.dependencies.seatRepository.findById(seatId);
    if (!seat) {
      throw new NotFoundError("Seat not found");
    }

    const showtime = await this.dependencies.showtimeRepository.findByIdAndPartnerId(
      seat.showtimeId,
      partnerId,
    );
    if (!showtime) {
      throw new UnauthorizedError("You don't have permission to modify this seat");
    }

    const updated = await this.dependencies.seatRepository.update(seatId, parsed.data);
    return updated;
  }

  async getSeatMap(partnerId: string, showtimeId: string): Promise<any> {
    const showtime = await this.dependencies.showtimeRepository.findByIdAndPartnerId(
      showtimeId,
      partnerId,
    );
    if (!showtime) {
      throw new NotFoundError("Showtime not found");
    }

    const seats = await this.dependencies.seatRepository.findByShowtimeId(showtimeId);

    // Group by row
    const seatMap: { [key: string]: any[] } = {};
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

/**
 * ==========================================
 * TICKET & CHECK-IN USE CASE
 * ==========================================
 */

export class TicketCheckInUseCase implements ITicketCheckInUseCase {
  constructor(private readonly dependencies: PartnerHexagonDependencies) {}

  async getTickets(partnerId: string, query: ListTicketsQueryDTO) {
    const partner = await this.dependencies.partnerRepository.findById(partnerId);
    if (!partner) {
      throw new NotFoundError("Partner not found");
    }

    return this.dependencies.ticketRepository.findByPartnerId(partnerId, query);
  }

  async getTicketDetail(partnerId: string, ticketId: string): Promise<Ticket> {
    const ticket = await this.dependencies.ticketRepository.findById(ticketId);
    if (!ticket || ticket.partnerId !== partnerId) {
      throw new NotFoundError("Ticket not found");
    }

    return ticket;
  }

  async checkInTicket(
    partnerId: string,
    data: CheckInDTO,
  ): Promise<{ message: string; ticketId: string }> {
    const parsed = CheckInPayloadDTO.safeParse(data);
    if (!parsed.success) {
      throw new ValidationError("Invalid check-in data", parsed.error.issues);
    }

    // Find ticket by QR code
    const ticket = await this.dependencies.ticketRepository.findByQRCode(parsed.data.qrCode);
    if (!ticket) {
      throw new NotFoundError("Ticket not found");
    }

    if (ticket.partnerId !== partnerId) {
      throw new UnauthorizedError("You don't have permission to check in this ticket");
    }

    if (ticket.status !== "CONFIRMED") {
      throw new ValidationError("Ticket is not in confirmed status");
    }

    // Check if already used
    const existingCheckIn = await this.dependencies.checkInRepository.findByTicketId(ticket.id);
    if (existingCheckIn) {
      throw new ValidationError("Ticket already checked in");
    }

    // Create check-in record
    const checkIn: CheckIn = {
      id: v7(),
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

    logger.info(`[CheckIn] Checked in ticket ${ticket.id}`);

    return { message: "Check-in successful", ticketId: ticket.id };
  }

  async getCheckInHistory(partnerId: string, showtimeId: string): Promise<CheckIn[]> {
    const showtime = await this.dependencies.showtimeRepository.findByIdAndPartnerId(
      showtimeId,
      partnerId,
    );
    if (!showtime) {
      throw new NotFoundError("Showtime not found");
    }

    return this.dependencies.checkInRepository.findByShowtimeId(showtimeId);
  }
}

/**
 * ==========================================
 * PARTNER FINANCE USE CASE
 * ==========================================
 */

export class PartnerFinanceUseCase implements IPartnerFinanceUseCase {
  constructor(private readonly dependencies: PartnerHexagonDependencies) {}

  async getWallet(partnerId: string): Promise<PartnerWallet> {
    let wallet = await this.dependencies.walletRepository.findByPartnerId(partnerId);
    if (!wallet) {
      // Create wallet if not exists
      const newWallet: PartnerWallet = {
        id: v7(),
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

  async getTransactions(partnerId: string) {
    return this.dependencies.transactionRepository.findByPartnerId(partnerId);
  }

  async getRevenue(partnerId: string, query: RevenueQueryDTO): Promise<any> {
    if (!query.startDate || !query.endDate) {
      throw new ValidationError("Start date and end date are required");
    }

    const revenue = await this.dependencies.transactionRepository.findRevenueByPeriod(
      partnerId,
      new Date(query.startDate),
      new Date(query.endDate),
    );

    return {
      period: `${query.startDate} to ${query.endDate}`,
      totalRevenue: revenue.amount,
      ticketsSold: revenue.count,
    };
  }

  async getRevenueByMovie(partnerId: string, startDate?: Date, endDate?: Date): Promise<any> {
    // TODO: Implement grouping by movie
    return [];
  }

  async createWithdrawal(
    partnerId: string,
    data: CreateWithdrawalDTO,
  ): Promise<{ withdrawalId: string }> {
    const parsed = CreateWithdrawalPayloadDTO.safeParse(data);
    if (!parsed.success) {
      throw new ValidationError("Invalid withdrawal data", parsed.error.issues);
    }

    const wallet = await this.getWallet(partnerId);
    if (wallet.balance < parsed.data.amount) {
      throw new ValidationError("Insufficient balance");
    }

    const withdrawalId = v7();
    const newWithdrawal: Withdrawal = {
      id: withdrawalId,
      partnerId,
      amount: parsed.data.amount,
      bankAccountNumber: parsed.data.bankAccountNumber,
      bankName: parsed.data.bankName,
      bankCode: parsed.data.bankCode,
      status: WithdrawalStatus.PENDING,
      transactionReference: null,
      failureReason: null,
      processedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.dependencies.withdrawalRepository.insert(newWithdrawal);

    // Deduct from balance
    await this.dependencies.walletRepository.decrementBalance(partnerId, parsed.data.amount);

    logger.info(`[Withdrawal] Created withdrawal ${withdrawalId} for amount ${parsed.data.amount}`);

    return { withdrawalId };
  }

  async getWithdrawals(partnerId: string, query: ListWithdrawalsQueryDTO) {
    return this.dependencies.withdrawalRepository.findByPartnerId(partnerId, query);
  }

  async getWithdrawalDetail(partnerId: string, withdrawalId: string): Promise<Withdrawal> {
    const withdrawal = await this.dependencies.withdrawalRepository.findById(withdrawalId);
    if (!withdrawal || withdrawal.partnerId !== partnerId) {
      throw new NotFoundError("Withdrawal not found");
    }

    return withdrawal;
  }
}

/**
 * ==========================================
 * PARTNER DASHBOARD USE CASE
 * ==========================================
 */

export class PartnerDashboardUseCase implements IPartnerDashboardUseCase {
  constructor(private readonly dependencies: PartnerHexagonDependencies) {}

  async getDashboardStats(partnerId: string): Promise<any> {
    const wallet = await this.dependencies.walletRepository.findByPartnerId(partnerId);
    const pendingWithdrawals = await this.dependencies.withdrawalRepository.findByPartnerId(
      partnerId,
      {
        page: 1,
        limit: 100,
        status: "PENDING",
      },
    );

    return {
      walletBalance: wallet?.balance || 0,
      totalEarned: wallet?.totalEarned || 0,
      totalWithdrawn: wallet?.totalWithdrawn || 0,
      pendingWithdrawals: pendingWithdrawals.total,
    };
  }

  async getTopMovies(partnerId: string, limit?: number): Promise<any> {
    // TODO: Implement grouping by movie with ticket count and revenue
    return [];
  }

  async getOccupancyStats(partnerId: string, startDate?: Date, endDate?: Date): Promise<any> {
    // TODO: Implement occupancy calculation
    return {};
  }
}
