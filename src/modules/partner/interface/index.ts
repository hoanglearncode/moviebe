import { IRepository } from "../../../share/interface";
import {
  PartnerProfile,
  Movie,
  Showtime,
  Seat,
  Ticket,
  Transaction,
  Withdrawal,
  CheckIn,
  PartnerWallet,
  TicketListResponse,
  WithdrawalListResponse,
  TransactionListResponse,
} from "../model/model";
import {
  RegisterPartnerDTO,
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
} from "../model/dto";

/**
 * ==========================================
 * REPOSITORY INTERFACES
 * ==========================================
 */

export interface IPartnerRepository extends IRepository<
  PartnerProfile,
  Partial<PartnerProfile>,
  Partial<PartnerProfile>
> {
  findById(partnerId: string): Promise<PartnerProfile | null>;
  findByUserId(userId: string): Promise<PartnerProfile | null>;
  findByTaxCode(taxCode: string): Promise<PartnerProfile | null>;
}

export interface IMovieRepository extends IRepository<Movie, Partial<Movie>, Partial<Movie>> {
  findById(movieId: string): Promise<Movie | null>;
  findByPartnerId(
    partnerId: string,
    query: ListMoviesQueryDTO,
  ): Promise<{ items: Movie[]; total: number }>;
  findByIdAndPartnerId(movieId: string, partnerId: string): Promise<Movie | null>;
  updateStatus(movieId: string, status: string): Promise<boolean>;
}

export interface IShowtimeRepository extends IRepository<
  Showtime,
  Partial<Showtime>,
  Partial<Showtime>
> {
  findById(showtimeId: string): Promise<Showtime | null>;
  findByPartnerId(
    partnerId: string,
    query: ListShowtimesQueryDTO,
  ): Promise<{ items: Showtime[]; total: number }>;
  findByIdAndPartnerId(showtimeId: string, partnerId: string): Promise<Showtime | null>;
  updateAvailableSeats(showtimeId: string, available: number): Promise<boolean>;
}

export interface ISeatRepository extends IRepository<Seat, Partial<Seat>, Partial<Seat>> {
  findById(seatId: string): Promise<Seat | null>;
  findByShowtimeId(showtimeId: string): Promise<Seat[]>;
  findBySeatNumbers(showtimeId: string, seatNumbers: string[]): Promise<Seat[]>;
  updateStatus(
    seatId: string,
    status: string,
    lockedUntil?: Date,
    lockedBy?: string,
  ): Promise<boolean>;
  updateBulkStatus(seatIds: string[], status: string): Promise<number>;
}

export interface ITicketRepository extends IRepository<Ticket, Partial<Ticket>, Partial<Ticket>> {
  findById(ticketId: string): Promise<Ticket | null>;
  findByQRCode(qrCode: string): Promise<Ticket | null>;
  findByPartnerId(partnerId: string, query: ListTicketsQueryDTO): Promise<TicketListResponse>;
  findByShowtimeId(showtimeId: string): Promise<Ticket[]>;
  updateStatus(ticketId: string, status: string): Promise<boolean>;
}

export interface ITransactionRepository extends IRepository<
  Transaction,
  Partial<Transaction>,
  Partial<Transaction>
> {
  findByPartnerId(partnerId: string): Promise<Transaction[]>;
  findRevenueByPeriod(
    partnerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ amount: number; count: number }>;
  findByType(partnerId: string, type: string): Promise<Transaction[]>;
}

export interface IWithdrawalRepository extends IRepository<
  Withdrawal,
  Partial<Withdrawal>,
  Partial<Withdrawal>
> {
  findById(withdrawalId: string): Promise<Withdrawal | null>;
  findByPartnerId(
    partnerId: string,
    query: ListWithdrawalsQueryDTO,
  ): Promise<WithdrawalListResponse>;
  updateStatus(withdrawalId: string, status: string): Promise<boolean>;
}

export interface ICheckInRepository extends IRepository<
  CheckIn,
  Partial<CheckIn>,
  Partial<CheckIn>
> {
  findByTicketId(ticketId: string): Promise<CheckIn | null>;
  findByShowtimeId(showtimeId: string): Promise<CheckIn[]>;
  countByShowtimeId(showtimeId: string): Promise<number>;
}

export interface IWalletRepository extends IRepository<
  PartnerWallet,
  Partial<PartnerWallet>,
  Partial<PartnerWallet>
> {
  findByPartnerId(partnerId: string): Promise<PartnerWallet | null>;
  updateBalance(partnerId: string, amount: number): Promise<boolean>;
  incrementBalance(partnerId: string, amount: number): Promise<boolean>;
  decrementBalance(partnerId: string, amount: number): Promise<boolean>;
}

/**
 * ==========================================
 * SERVICE INTERFACES
 * ==========================================
 */

export interface IPartnerNotificationService {
  sendWithdrawalPending(input: { email: string; amount: number; reference: string }): Promise<void>;
  sendWithdrawalCompleted(input: {
    email: string;
    amount: number;
    reference: string;
  }): Promise<void>;
  sendWithdrawalFailed(input: { email: string; amount: number; reason: string }): Promise<void>;
  sendMovieApproved(input: { email: string; movieTitle: string }): Promise<void>;
  sendMovieRejected(input: { email: string; movieTitle: string; reason: string }): Promise<void>;
  sendDailyRevenue(input: { email: string; revenue: number; date: string }): Promise<void>;
}

/**
 * ==========================================
 * USE CASE INTERFACES
 * ==========================================
 */

/**
 * Partner Profile UseCase
 */
export interface IPartnerProfileUseCase {
  getProfile(partnerId: string): Promise<PartnerProfile>;
  updateProfile(partnerId: string, data: UpdatePartnerDTO): Promise<PartnerProfile>;
  getStatus(partnerId: string): Promise<{ status: string; approvedAt?: Date }>;
}

/**
 * Movie Management UseCase
 */
export interface IMovieManagementUseCase {
  createMovie(partnerId: string, data: CreateMovieDTO): Promise<{ movieId: string }>;
  getMovies(
    partnerId: string,
    query: ListMoviesQueryDTO,
  ): Promise<{ items: Movie[]; total: number }>;
  getMovieDetail(partnerId: string, movieId: string): Promise<Movie>;
  updateMovie(partnerId: string, movieId: string, data: UpdateMovieDTO): Promise<Movie>;
  deleteMovie(partnerId: string, movieId: string): Promise<{ message: string }>;
  submitMovieForApproval(partnerId: string, movieId: string): Promise<{ message: string }>;
}

/**
 * Showtime Management UseCase
 */
export interface IShowtimeManagementUseCase {
  createShowtime(partnerId: string, data: CreateShowtimeDTO): Promise<{ showtimeId: string }>;
  getShowtimes(
    partnerId: string,
    query: ListShowtimesQueryDTO,
  ): Promise<{ items: Showtime[]; total: number }>;
  getShowtimeDetail(partnerId: string, showtimeId: string): Promise<Showtime>;
  updateShowtime(partnerId: string, showtimeId: string, data: UpdateShowtimeDTO): Promise<Showtime>;
  cancelShowtime(partnerId: string, showtimeId: string): Promise<{ message: string }>;
}

/**
 * Seat Management UseCase (for partner to configure seats)
 */
export interface ISeatManagementUseCase {
  getSeats(partnerId: string, showtimeId: string): Promise<Seat[]>;
  updateSeat(partnerId: string, seatId: string, data: UpdateSeatDTO): Promise<Seat>;
  getSeatMap(partnerId: string, showtimeId: string): Promise<any>; // Formatted seat map
}

/**
 * Ticket & Check-in UseCase
 */
export interface ITicketCheckInUseCase {
  getTickets(partnerId: string, query: ListTicketsQueryDTO): Promise<TicketListResponse>;
  getTicketDetail(partnerId: string, ticketId: string): Promise<Ticket>;
  checkInTicket(
    partnerId: string,
    data: CheckInDTO,
  ): Promise<{ message: string; ticketId: string }>;
  getCheckInHistory(partnerId: string, showtimeId: string): Promise<CheckIn[]>;
}

/**
 * Finance UseCase
 */
export interface IPartnerFinanceUseCase {
  getWallet(partnerId: string): Promise<PartnerWallet>;
  getTransactions(partnerId: string): Promise<Transaction[]>;
  getRevenue(partnerId: string, query: RevenueQueryDTO): Promise<any>;
  getRevenueByMovie(partnerId: string, startDate?: Date, endDate?: Date): Promise<any>;
  createWithdrawal(partnerId: string, data: CreateWithdrawalDTO): Promise<{ withdrawalId: string }>;
  getWithdrawals(
    partnerId: string,
    query: ListWithdrawalsQueryDTO,
  ): Promise<WithdrawalListResponse>;
  getWithdrawalDetail(partnerId: string, withdrawalId: string): Promise<Withdrawal>;
}

/**
 * Dashboard UseCase
 */
export interface IPartnerDashboardUseCase {
  getDashboardStats(partnerId: string): Promise<any>;
  getTopMovies(partnerId: string, limit?: number): Promise<any>;
  getOccupancyStats(partnerId: string, startDate?: Date, endDate?: Date): Promise<any>;
}

/**
 * ==========================================
 * HEXAGON DEPENDENCIES
 * ==========================================
 */

export interface PartnerHexagonDependencies {
  partnerRepository: IPartnerRepository;
  movieRepository: IMovieRepository;
  showtimeRepository: IShowtimeRepository;
  seatRepository: ISeatRepository;
  ticketRepository: ITicketRepository;
  transactionRepository: ITransactionRepository;
  withdrawalRepository: IWithdrawalRepository;
  checkInRepository: ICheckInRepository;
  walletRepository: IWalletRepository;
  notificationService: IPartnerNotificationService;
}
