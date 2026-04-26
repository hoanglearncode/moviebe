"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeatManagementUseCase = void 0;
class SeatManagementUseCase {
    constructor(showtimeRepo, seatRepo, movieRepo) {
        this.showtimeRepo = showtimeRepo;
        this.seatRepo = seatRepo;
        this.movieRepo = movieRepo;
    }
    async getSeats(partnerId, showtimeId) {
        const showtime = await this.showtimeRepo.findByIdAndPartnerId(showtimeId, partnerId);
        if (!showtime)
            throw new Error("Showtime not found");
        return this.seatRepo.findByShowtimeId(showtimeId);
    }
    async updateSeat(partnerId, seatId, data) {
        const seat = await this.seatRepo.findById(seatId);
        if (!seat)
            throw new Error("Seat not found");
        const showtime = await this.showtimeRepo.findByIdAndPartnerId(seat.showtimeId, partnerId);
        if (!showtime)
            throw new Error("Unauthorized: seat does not belong to your showtime");
        const updateData = { updatedAt: new Date() };
        if (data.type !== undefined)
            updateData.seatType = data.type;
        if (data.status !== undefined)
            updateData.status = data.status;
        if (data.price !== undefined)
            updateData.price = data.price;
        await this.seatRepo.update(seatId, updateData);
        const updated = await this.seatRepo.findById(seatId);
        if (!updated)
            throw new Error("Seat not found after update");
        return updated;
    }
    async getSeatMap(partnerId, showtimeId) {
        const showtime = await this.showtimeRepo.findByIdAndPartnerId(showtimeId, partnerId);
        if (!showtime)
            throw new Error("Showtime not found");
        const [seats, movie] = await Promise.all([
            this.seatRepo.findByShowtimeId(showtimeId),
            this.movieRepo.findByIdAndPartnerId(showtime.movieId, partnerId),
        ]);
        const rowMap = {};
        for (const seat of seats) {
            const row = seat.seatNumber.replace(/\d+$/, "");
            if (!rowMap[row])
                rowMap[row] = [];
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
exports.SeatManagementUseCase = SeatManagementUseCase;
