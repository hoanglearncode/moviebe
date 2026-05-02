import { IShowtimeRepository } from "@/modules/partner/interface/showtime.interface";
import {
  ISeatRepository,
  ISeatManagementUseCase,
} from "@/modules/partner/interface/seat.interface";
import { IMovieRepository } from "@/modules/partner/interface/movie.interface";
import { Seat, SeatType, SeatStatus } from "@/modules/partner/model/model";
import { UpdateSeatDTO } from "@/modules/partner/model/dto";

export class SeatManagementUseCase implements ISeatManagementUseCase {
  constructor(
    private readonly showtimeRepo: IShowtimeRepository,
    private readonly seatRepo: ISeatRepository,
    private readonly movieRepo: IMovieRepository,
  ) {}

  async getSeats(partnerId: string, showtimeId: string): Promise<Seat[]> {
    const showtime = await this.showtimeRepo.findByIdAndPartnerId(showtimeId, partnerId);
    if (!showtime) throw new Error("Showtime not found");
    return this.seatRepo.findByShowtimeId(showtimeId);
  }

  async updateSeat(partnerId: string, seatId: string, data: UpdateSeatDTO): Promise<Seat> {
    const seat = await this.seatRepo.findById(seatId);
    if (!seat) throw new Error("Seat not found");

    const showtime = await this.showtimeRepo.findByIdAndPartnerId(seat.showtimeId, partnerId);
    if (!showtime) throw new Error("Unauthorized: seat does not belong to your showtime");

    const updateData: Partial<Seat> = { updatedAt: new Date() };
    if (data.type !== undefined) updateData.seatType = data.type as SeatType;
    if (data.status !== undefined) updateData.status = data.status as SeatStatus;
    if (data.price !== undefined) updateData.price = data.price;

    await this.seatRepo.update(seatId, updateData);

    const updated = await this.seatRepo.findById(seatId);
    if (!updated) throw new Error("Seat not found after update");
    return updated;
  }

  async getSeatMap(partnerId: string, showtimeId: string): Promise<any> {
    const showtime = await this.showtimeRepo.findByIdAndPartnerId(showtimeId, partnerId);
    if (!showtime) throw new Error("Showtime not found");

    const [seats, movie] = await Promise.all([
      this.seatRepo.findByShowtimeId(showtimeId),
      this.movieRepo.findByIdAndPartnerId(showtime.movieId, partnerId),
    ]);

    const rowMap: Record<string, Seat[]> = {};
    for (const seat of seats) {
      const row = seat.seatNumber.replace(/\d+$/, "");
      if (!rowMap[row]) rowMap[row] = [];
      rowMap[row].push(seat);
    }

    const rows = Object.entries(rowMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([row, rowSeats]) => ({
        row,
        seats: rowSeats
          .sort((a, b) => a.seatNumber.localeCompare(b.seatNumber))
          .map((s) => ({
            id: s.id,
            seatNumber: s.seatNumber,
            type: s.seatType,
            status: s.status,
            price: s.price,
            lockedUntil: s.lockedUntil ?? null,
          })),
      }));

    return {
      showtimeId,
      movieTitle: movie?.title ?? "",
      startTime: showtime.startTime,
      totalSeats: showtime.totalSeats,
      availableSeats: showtime.availableSeats,
      bookedSeats: showtime.bookedSeats,
      rows,
    };
  }
}
