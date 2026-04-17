import { randomUUID } from "crypto";
import { IPartnerRepository } from "../interface/profile.interface";
import { IMovieRepository } from "../interface/movie.interface";
import { IShowtimeRepository, IShowtimeManagementUseCase } from "../interface/showtime.interface";
import { ISeatRepository } from "../interface/seat.interface";
import { ITicketRepository } from "../interface/ticket.interface";
import { IWalletRepository, ITransactionRepository } from "../interface/finance.interface";
import {
  PartnerProfile,
  Showtime,
  Seat,
  SeatType,
  SeatStatus,
  Transaction,
  TransactionType,
  TransactionStatus,
} from "../model/model";
import { CreateShowtimeDTO, UpdateShowtimeDTO, ListShowtimesQueryDTO } from "../model/dto";

export class ShowtimeManagementUseCase implements IShowtimeManagementUseCase {
  constructor(
    private readonly partnerRepo: IPartnerRepository,
    private readonly movieRepo: IMovieRepository,
    private readonly showtimeRepo: IShowtimeRepository,
    private readonly seatRepo: ISeatRepository,
    private readonly ticketRepo: ITicketRepository,
    private readonly walletRepo: IWalletRepository,
    private readonly transactionRepo: ITransactionRepository,
  ) {}

  private async requireApprovedPartner(partnerId: string): Promise<PartnerProfile> {
    const partner = await this.partnerRepo.findById(partnerId);
    if (!partner) throw new Error("Partner not found");
    if (partner.status !== "ACTIVE")
      throw new Error(`Partner is not approved (current status: ${partner.status})`);
    return partner;
  }

  async createShowtime(
    partnerId: string,
    data: CreateShowtimeDTO,
  ): Promise<{ showtimeId: string }> {
    await this.requireApprovedPartner(partnerId);

    const movie = await this.movieRepo.findByIdAndPartnerId(data.movieId, partnerId);
    if (!movie) throw new Error("Movie not found");
    if (movie.status !== "APPROVED" && movie.status !== "ACTIVE")
      throw new Error("Movie must be APPROVED or ACTIVE to create a showtime");

    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + (movie.duration + 15) * 60 * 1000);

    // Validate no overlapping showtimes in the same room
    const existing = await this.showtimeRepo.findByPartnerId(partnerId, {
      page: 1,
      limit: 1000,
      sortBy: "startTime",
      sortOrder: "asc",
    });
    const conflict = existing.items.find(
      (s) =>
        s.roomId === data.roomId &&
        s.status !== "CANCELLED" &&
        s.startTime < endTime &&
        s.endTime > startTime,
    );
    if (conflict)
      throw new Error(
        `Time slot conflict: room is already booked from ${conflict.startTime.toISOString()} to ${conflict.endTime.toISOString()}`,
      );

    const showtimeId = randomUUID();
    const now = new Date();
    const showtime: Showtime = {
      id: showtimeId,
      movieId: data.movieId,
      partnerId,
      roomId: data.roomId,
      startTime,
      endTime,
      basePrice: data.basePrice,
      status: "SCHEDULED",
      totalSeats: data.totalSeats,
      availableSeats: data.totalSeats,
      bookedSeats: 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.showtimeRepo.insert(showtime);
    await this._createSeatsForShowtime(showtimeId, data.totalSeats, data.basePrice);

    return { showtimeId };
  }

  private async _createSeatsForShowtime(
    showtimeId: string,
    totalSeats: number,
    basePrice: number,
  ): Promise<void> {
    const rows = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const seatsPerRow = 10;
    const now = new Date();

    for (let i = 0; i < totalSeats; i++) {
      const rowIndex = Math.floor(i / seatsPerRow);
      const colIndex = (i % seatsPerRow) + 1;
      const rowLabel = rows[rowIndex] ?? `R${rowIndex + 1}`;
      const seat: Seat = {
        id: randomUUID(),
        showtimeId,
        seatNumber: `${rowLabel}${colIndex}`,
        rowLabel,
        columnNumber: colIndex,
        seatType: SeatType.STANDARD,
        status: SeatStatus.AVAILABLE,
        price: basePrice,
        lockedUntil: null,
        lockedBy: null,
        createdAt: now,
        updatedAt: now,
      };
      await this.seatRepo.insert(seat);
    }
  }

  async getShowtimes(
    partnerId: string,
    query: ListShowtimesQueryDTO,
  ): Promise<{ items: Showtime[]; total: number }> {
    return this.showtimeRepo.findByPartnerId(partnerId, query);
  }

  async getShowtimeDetail(partnerId: string, showtimeId: string): Promise<Showtime> {
    const showtime = await this.showtimeRepo.findByIdAndPartnerId(showtimeId, partnerId);
    if (!showtime) throw new Error("Showtime not found");
    return showtime;
  }

  async updateShowtime(
    partnerId: string,
    showtimeId: string,
    data: UpdateShowtimeDTO,
  ): Promise<boolean> {
    const showtime = await this.showtimeRepo.findByIdAndPartnerId(showtimeId, partnerId);
    if (!showtime) throw new Error("Showtime not found");
    if (showtime.status !== "SCHEDULED") throw new Error("Only SCHEDULED showtimes can be updated");

    await this.showtimeRepo.update(showtimeId, { ...data, updatedAt: new Date() });
    return true;
  }

  async cancelShowtime(partnerId: string, showtimeId: string): Promise<{ message: string }> {
    const showtime = await this.showtimeRepo.findByIdAndPartnerId(showtimeId, partnerId);
    if (!showtime) throw new Error("Showtime not found");
    if (showtime.status === "CANCELLED") throw new Error("Showtime is already cancelled");
    if (showtime.status === "ENDED") throw new Error("Cannot cancel an ended showtime");

    const tickets = await this.ticketRepo.findByShowtimeId(showtimeId);
    const soldTickets = tickets.filter((t) => t.status === "CONFIRMED" || t.status === "RESERVED");

    for (const ticket of soldTickets) {
      await this.ticketRepo.updateStatus(ticket.id, "REFUNDED");
      await this.seatRepo.updateStatus(ticket.seatId, SeatStatus.AVAILABLE);

      if (ticket.partnerAmount > 0) {
        await this.walletRepo.decrementBalance(partnerId, ticket.partnerAmount);
        const refundTx: Transaction = {
          id: randomUUID(),
          partnerId,
          type: TransactionType.REFUND,
          amount: -ticket.partnerAmount,
          status: TransactionStatus.COMPLETED,
          ticketId: ticket.id,
          description: `Refund for cancelled showtime ${showtimeId}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await this.transactionRepo.insert(refundTx);
      }
    }

    await this.showtimeRepo.updateStatus(showtimeId, "CANCELLED");
    return { message: `Showtime cancelled. ${soldTickets.length} ticket(s) refunded.` };
  }
}
