import { IRepository } from "@/share/interface";
import { Showtime } from "@/modules/partner/model/model";
import {
  CreateShowtimeDTO,
  UpdateShowtimeDTO,
  ListShowtimesQueryDTO,
} from "@/modules/partner/model/dto";

// ─── Repository Port ──────────────────────────────────────────────────────────

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
  updateStatus(showtimeId: string, status: string): Promise<boolean>;
}

// ─── Use-Case Port ────────────────────────────────────────────────────────────

export interface IShowtimeManagementUseCase {
  createShowtime(partnerId: string, data: CreateShowtimeDTO): Promise<{ showtimeId: string }>;
  getShowtimes(
    partnerId: string,
    query: ListShowtimesQueryDTO,
  ): Promise<{ items: Showtime[]; total: number }>;
  getShowtimeDetail(partnerId: string, showtimeId: string): Promise<Showtime>;
  updateShowtime(partnerId: string, showtimeId: string, data: UpdateShowtimeDTO): Promise<boolean>;
  cancelShowtime(partnerId: string, showtimeId: string): Promise<{ message: string }>;
}
