import { IRepository } from "../../../share/interface";
import { Seat } from "../model/model";
import { UpdateSeatDTO } from "../model/dto";

// ─── Repository Port ──────────────────────────────────────────────────────────

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
  updateBulkStatus(seatIds: string[], status: string): Promise<boolean>;
}

// ─── Use-Case Port ────────────────────────────────────────────────────────────

export interface ISeatManagementUseCase {
  getSeats(partnerId: string, showtimeId: string): Promise<Seat[]>;
  updateSeat(partnerId: string, seatId: string, data: UpdateSeatDTO): Promise<Seat>;
  getSeatMap(partnerId: string, showtimeId: string): Promise<any>;
}