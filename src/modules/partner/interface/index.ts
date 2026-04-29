/**
 * Partner module — Ports (interfaces) barrel.
 *
 * Each domain owns its own interface file; this barrel re-exports
 * everything so existing import paths continue to work.
 */

export type { IPartnerRepository, IPartnerProfileUseCase } from "./profile.interface";
export type { IMovieRepository, IMovieManagementUseCase } from "./movie.interface";
export type { IShowtimeRepository, IShowtimeManagementUseCase } from "./showtime.interface";
export type { ISeatRepository, ISeatManagementUseCase } from "./seat.interface";
export type {
  ITicketRepository,
  ICheckInRepository,
  ITicketCheckInUseCase,
} from "./ticket.interface";
export type {
  ITransactionRepository,
  IWithdrawalRepository,
  IWalletRepository,
  IPartnerNotificationService,
  IPartnerFinanceUseCase,
} from "./finance.interface";
export type { IPartnerDashboardUseCase } from "./dashboard.interface";
export type { IPartnerServicesUseCase } from "./services.interface";
export type { IStaffRepo } from "./staff.interface";

import type { IPartnerRepository } from "./profile.interface";
import type { IMovieRepository } from "./movie.interface";
import type { IShowtimeRepository } from "./showtime.interface";
import type { ISeatRepository } from "./seat.interface";
import type { ITicketRepository, ICheckInRepository } from "./ticket.interface";
import type {
  ITransactionRepository,
  IWithdrawalRepository,
  IWalletRepository,
  IPartnerNotificationService,
} from "./finance.interface";
import type { IStaffRepo } from "./staff.interface";

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
  staffRepository: IStaffRepo;
  notificationService: IPartnerNotificationService;
}
