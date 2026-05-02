/**
 * Partner module — Ports (interfaces) barrel.
 *
 * Each domain owns its own interface file; this barrel re-exports
 * everything so existing import paths continue to work.
 */

export type {
  IPartnerRepository,
  IPartnerProfileUseCase,
} from "@/modules/partner/interface/profile.interface";
export type {
  IMovieRepository,
  IMovieManagementUseCase,
} from "@/modules/partner/interface/movie.interface";
export type {
  IShowtimeRepository,
  IShowtimeManagementUseCase,
} from "@/modules/partner/interface/showtime.interface";
export type {
  ISeatRepository,
  ISeatManagementUseCase,
} from "@/modules/partner/interface/seat.interface";
export type {
  ITicketRepository,
  ICheckInRepository,
  ITicketCheckInUseCase,
} from "@/modules/partner/interface/ticket.interface";
export type {
  ITransactionRepository,
  IWithdrawalRepository,
  IWalletRepository,
  IPartnerNotificationService,
  IPartnerFinanceUseCase,
} from "@/modules/partner/interface/finance.interface";
export type { IPartnerDashboardUseCase } from "@/modules/partner/interface/dashboard.interface";
export type { IPartnerServicesUseCase } from "@/modules/partner/interface/services.interface";
export type { IStaffRepo } from "@/modules/partner/interface/staff.interface";

import type { IPartnerRepository } from "@/modules/partner/interface/profile.interface";
import type { IMovieRepository } from "@/modules/partner/interface/movie.interface";
import type { IShowtimeRepository } from "@/modules/partner/interface/showtime.interface";
import type { ISeatRepository } from "@/modules/partner/interface/seat.interface";
import type {
  ITicketRepository,
  ICheckInRepository,
} from "@/modules/partner/interface/ticket.interface";
import type {
  ITransactionRepository,
  IWithdrawalRepository,
  IWalletRepository,
  IPartnerNotificationService,
} from "@/modules/partner/interface/finance.interface";
import type { IStaffRepo } from "@/modules/partner/interface/staff.interface";

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
