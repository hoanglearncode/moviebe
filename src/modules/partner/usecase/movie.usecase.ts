import { randomUUID } from "crypto";
import { IPartnerRepository } from "@/modules/partner/interface/profile.interface";
import {
  IMovieRepository,
  IMovieManagementUseCase,
} from "@/modules/partner/interface/movie.interface";
import { IShowtimeRepository } from "@/modules/partner/interface/showtime.interface";
import { ISeatRepository } from "@/modules/partner/interface/seat.interface";
import { IRoomRepository } from "@/modules/partner/infras/repository/room.repo";
import {
  PartnerProfile,
  Movie,
  AdminMovieRow,
  AdminMovieStats,
  Showtime,
  Seat,
  SeatType,
  SeatStatus,
} from "@/modules/partner/model/model";
import {
  CreateMovieDTO,
  UpdateMovieDTO,
  ListMoviesQueryDTO,
  ShowtimePlanDTO,
} from "@/modules/partner/model/dto";

export class MovieManagementUseCase implements IMovieManagementUseCase {
  constructor(
    private readonly partnerRepo: IPartnerRepository,
    private readonly movieRepo: IMovieRepository,
    private readonly showtimeRepo?: IShowtimeRepository,
    private readonly seatRepo?: ISeatRepository,
    private readonly roomRepo?: IRoomRepository,
  ) {}

  private async requireApprovedPartner(partnerId: string): Promise<PartnerProfile> {
    const partner = await this.partnerRepo.findById(partnerId);
    if (!partner) throw new Error("Partner not found");
    if (partner.status !== "ACTIVE")
      throw new Error(`Partner is not approved (current status: ${partner.status})`);
    return partner;
  }

  private validateDateRange(releaseDate: Date, endDate: Date): void {
    if (releaseDate >= endDate) throw new Error("Release date must be before end date");
  }

  async createMovie(partnerId: string, data: CreateMovieDTO): Promise<{ movieId: string }> {
    await this.requireApprovedPartner(partnerId);

    const releaseDate = new Date(data.releaseDate);
    const endDate = new Date(data.endDate);
    this.validateDateRange(releaseDate, endDate);

    const movieId = randomUUID();
    const now = new Date();

    const movie: Movie = {
      id: movieId,
      partnerId,

      // Core
      title: data.title,
      description: data.description ?? null,
      genre: data.genre,
      language: data.language,
      duration: data.duration,
      releaseDate,
      endDate,
      rating: data.rating ?? null,
      status: "DRAFT",

      // Media
      posterUrl: data.posterUrl ?? null,
      backdropUrl: data.backdropUrl ?? null,
      trailerUrl: data.trailerUrl ?? null,

      // Extended metadata
      altTitle: data.altTitle ?? null,
      director: data.director ?? null,
      year: data.year ?? null,
      country: data.country ?? null,
      tags: data.tags ?? [],

      // Settings
      allowComments: data.allowComments ?? true,

      // Timestamps
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    // Persist movie row (without cast — handled separately via nested relation)
    await this.movieRepo.insert(movie);

    // Persist cast members if provided
    if (data.cast?.length) {
      const castWithIds = data.cast
        .filter((c) => c.name?.trim())
        .map((c, index) => ({
          id: randomUUID(),
          movieId,
          name: c.name.trim(),
          role: c.role?.trim() ?? "",
          photo: c.photo ?? null,
          order: index,
        }));

      if (castWithIds.length) {
        await this.movieRepo.replaceCast(movieId, castWithIds);
      }
    }

    // Persist showtime plans if provided and repos are available
    if (data.showtimes?.length && this.showtimeRepo && this.seatRepo && this.roomRepo) {
      await this._createShowtimesFromPlans(movieId, partnerId, movie.duration, data.showtimes);
    }

    return { movieId };
  }

  /**
   * Creates Showtime + Seat records from the partner's showtime plan.
   * Seats are generated from the room's layoutSeat grid.
   * Layout values: -1 = blocked, 0 = STANDARD, 1 = VIP, 2 = COUPLE
   */
  private async _createShowtimesFromPlans(
    movieId: string,
    partnerId: string,
    durationMinutes: number,
    plans: ShowtimePlanDTO[],
  ): Promise<void> {
    const ROWS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const SEAT_TYPE_MAP: Record<number, SeatType> = {
      0: SeatType.STANDARD,
      1: SeatType.VIP,
      2: SeatType.COUPLE,
    };

    for (const plan of plans) {
      const room = await this.roomRepo!.findById(plan.roomId);
      if (!room || room.partnerId !== partnerId) {
        // Skip invalid rooms silently — don't fail the whole movie creation
        continue;
      }

      const startTime = new Date(`${plan.date}T${plan.time}:00`);
      if (isNaN(startTime.getTime())) continue;
      const endTime = new Date(startTime.getTime() + (durationMinutes + 15) * 60 * 1000);

      // Derive seat counts and base price from layout + prices
      const layout: number[][] = (room.layoutSeat as number[][]) ?? [];
      const priceConfig: Record<string, number> = {};
      if (plan.prices.standard) priceConfig.standard = plan.prices.standard;
      if (plan.prices.vip) priceConfig.vip = plan.prices.vip;
      if (plan.prices.premium) priceConfig.premium = plan.prices.premium;
      if (plan.prices.couple) priceConfig.couple = plan.prices.couple;

      // basePrice = standard price, or lowest provided price, or 50000
      const allPrices = Object.values(priceConfig).filter((p) => p > 0);
      const basePrice = priceConfig.standard ?? (allPrices.length ? Math.min(...allPrices) : 50000);

      // Count actual (non-blocked) seats from layout
      const totalSeats = layout.flat().filter((cell) => cell !== -1).length;
      if (totalSeats === 0) continue;

      const showtimeId = randomUUID();
      const now = new Date();

      const showtime: Showtime = {
        id: showtimeId,
        movieId,
        partnerId,
        roomId: plan.roomId,
        startTime,
        endTime,
        basePrice,
        priceConfig,
        status: "SCHEDULED",
        totalSeats,
        availableSeats: totalSeats,
        bookedSeats: 0,
        createdAt: now,
        updatedAt: now,
      };

      await this.showtimeRepo!.insert(showtime);

      // Create seats from room layout grid
      const seats: Seat[] = [];
      for (let r = 0; r < layout.length; r++) {
        const row = layout[r];
        for (let c = 0; c < row.length; c++) {
          const cellValue = row[c];
          if (cellValue === -1) continue; // blocked cell

          const rowLabel = ROWS[r] ?? `R${r + 1}`;
          const colNumber = c + 1;
          const seatType = SEAT_TYPE_MAP[cellValue] ?? SeatType.STANDARD;
          const seatTypeKey = seatType.toLowerCase() as keyof typeof priceConfig;
          const price = priceConfig[seatTypeKey] ?? basePrice;

          seats.push({
            id: randomUUID(),
            showtimeId,
            seatNumber: `${rowLabel}${colNumber}`,
            rowLabel,
            columnNumber: colNumber,
            seatType,
            status: SeatStatus.AVAILABLE,
            price,
            lockedUntil: null,
            lockedBy: null,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      for (const seat of seats) {
        await this.seatRepo!.insert(seat);
      }
    }
  }

  async getMovies(
    partnerId: string,
    query: ListMoviesQueryDTO,
  ): Promise<{ items: Movie[]; total: number }> {
    return this.movieRepo.findByPartnerId(partnerId, query);
  }

  async getMovieDetail(partnerId: string, movieId: string): Promise<Movie> {
    const movie = await this.movieRepo.findByIdAndPartnerId(movieId, partnerId);
    if (!movie) throw new Error("Movie not found");
    return movie;
  }

  async updateMovie(partnerId: string, movieId: string, data: UpdateMovieDTO): Promise<Movie> {
    const movie = await this.movieRepo.findByIdAndPartnerId(movieId, partnerId);
    if (!movie) throw new Error("Movie not found");

    const editableStatuses = ["DRAFT", "SUBMITTED"];
    if (!editableStatuses.includes(movie.status))
      throw new Error("Only DRAFT or SUBMITTED movies can be updated");

    const { releaseDate, endDate, cast, showtimes: _showtimes, ...scalarFields } = data;

    const parsedRelease = releaseDate ? new Date(releaseDate) : movie.releaseDate;
    const parsedEnd = endDate ? new Date(endDate) : movie.endDate;
    this.validateDateRange(parsedRelease, parsedEnd);

    await this.movieRepo.update(movieId, {
      ...scalarFields,
      releaseDate: parsedRelease,
      endDate: parsedEnd,
      updatedAt: new Date(),
    });

    if (Array.isArray(cast)) {
      const castWithIds = cast
        .filter((c) => c.name?.trim())
        .map((c, index) => ({
          id: randomUUID(),
          movieId,
          name: c.name.trim(),
          role: c.role?.trim() ?? "",
          photo: c.photo ?? null,
          order: index,
        }));

      await this.movieRepo.replaceCast(movieId, castWithIds);
    }

    const updated = await this.movieRepo.findByIdAndPartnerId(movieId, partnerId);
    if (!updated) throw new Error("Movie not found after update");
    return updated;
  }

  async deleteMovie(partnerId: string, movieId: string): Promise<{ message: string }> {
    const movie = await this.movieRepo.findByIdAndPartnerId(movieId, partnerId);
    if (!movie) throw new Error("Movie not found");
    if (movie.status !== "DRAFT") throw new Error("Only DRAFT movies can be deleted");

    await this.movieRepo.delete(movieId, false);
    return { message: "Movie deleted successfully" };
  }

  async submitMovieForApproval(partnerId: string, movieId: string): Promise<{ message: string }> {
    const movie = await this.movieRepo.findByIdAndPartnerId(movieId, partnerId);
    if (!movie) throw new Error("Movie not found");
    if (movie.status !== "DRAFT")
      throw new Error("Only DRAFT movies can be submitted for approval");

    await this.movieRepo.updateStatus(movieId, "SUBMITTED");
    return { message: "Movie submitted for approval" };
  }

  // ── Admin Operations ────────────────────────────────────────────────────────

  async adminListMovies(
    query: ListMoviesQueryDTO,
  ): Promise<{ items: AdminMovieRow[]; total: number }> {
    return this.movieRepo.findAllForAdmin(query);
  }

  async adminGetMovieStats(): Promise<AdminMovieStats> {
    return this.movieRepo.getMovieStats();
  }

  async adminApproveMovie(movieId: string, note: string): Promise<{ message: string }> {
    const movie = await this.movieRepo.findById(movieId);
    if (!movie) throw new Error("Movie not found");
    if (movie.status !== "SUBMITTED") throw new Error("Only SUBMITTED movies can be approved");

    await this.movieRepo.update(movieId, { publishedAt: new Date(), updatedAt: new Date() });
    await this.movieRepo.updateStatus(movieId, "APPROVED");
    return { message: "Movie approved successfully" };
  }

  async adminRejectMovie(
    movieId: string,
    reason: string,
    note: string,
  ): Promise<{ message: string }> {
    const movie = await this.movieRepo.findById(movieId);
    if (!movie) throw new Error("Movie not found");
    if (movie.status !== "SUBMITTED") throw new Error("Only SUBMITTED movies can be rejected");

    await this.movieRepo.updateStatus(movieId, "REJECTED");
    return { message: "Movie rejected" };
  }
}
