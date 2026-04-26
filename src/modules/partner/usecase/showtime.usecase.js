"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowtimeManagementUseCase = void 0;
const crypto_1 = require("crypto");
const model_1 = require("../model/model");
class ShowtimeManagementUseCase {
    constructor(partnerRepo, movieRepo, showtimeRepo, seatRepo, ticketRepo, walletRepo, transactionRepo) {
        this.partnerRepo = partnerRepo;
        this.movieRepo = movieRepo;
        this.showtimeRepo = showtimeRepo;
        this.seatRepo = seatRepo;
        this.ticketRepo = ticketRepo;
        this.walletRepo = walletRepo;
        this.transactionRepo = transactionRepo;
    }
    async requireApprovedPartner(partnerId) {
        const partner = await this.partnerRepo.findById(partnerId);
        if (!partner)
            throw new Error("Partner not found");
        if (partner.status !== "ACTIVE")
            throw new Error(`Partner is not approved (current status: ${partner.status})`);
        return partner;
    }
    async createShowtime(partnerId, data) {
        await this.requireApprovedPartner(partnerId);
        const movie = await this.movieRepo.findByIdAndPartnerId(data.movieId, partnerId);
        if (!movie)
            throw new Error("Movie not found");
        if (movie.status === "REJECTED" || movie.status === "INACTIVE")
            throw new Error(`Cannot create a showtime for a movie with status: ${movie.status}`);
        const startTime = new Date(data.startTime);
        const endTime = new Date(startTime.getTime() + (movie.duration + 15) * 60 * 1000);
        // Validate no overlapping showtimes in the same room
        const existing = await this.showtimeRepo.findByPartnerId(partnerId, {
            page: 1,
            limit: 1000,
            sortBy: "startTime",
            sortOrder: "asc",
        });
        const conflict = existing.items.find((s) => s.roomId === data.roomId &&
            s.status !== "CANCELLED" &&
            s.startTime < endTime &&
            s.endTime > startTime);
        if (conflict)
            throw new Error(`Time slot conflict: room is already booked from ${conflict.startTime.toISOString()} to ${conflict.endTime.toISOString()}`);
        const showtimeId = (0, crypto_1.randomUUID)();
        const now = new Date();
        const showtime = {
            id: showtimeId,
            movieId: data.movieId,
            partnerId,
            roomId: data.roomId,
            startTime,
            endTime,
            basePrice: data.basePrice,
            priceConfig: {},
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
    async _createSeatsForShowtime(showtimeId, totalSeats, basePrice) {
        const ROWS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const seatsPerRow = 10;
        const now = new Date();
        for (let i = 0; i < totalSeats; i++) {
            const rowIndex = Math.floor(i / seatsPerRow);
            const colIndex = (i % seatsPerRow) + 1;
            const rowLabel = ROWS[rowIndex] ?? `R${rowIndex + 1}`;
            const seat = {
                id: (0, crypto_1.randomUUID)(),
                showtimeId,
                seatNumber: `${rowLabel}${colIndex}`,
                rowLabel,
                columnNumber: colIndex,
                seatType: model_1.SeatType.STANDARD,
                status: model_1.SeatStatus.AVAILABLE,
                price: basePrice,
                lockedUntil: null,
                lockedBy: null,
                createdAt: now,
                updatedAt: now,
            };
            await this.seatRepo.insert(seat);
        }
    }
    async getShowtimes(partnerId, query) {
        return this.showtimeRepo.findByPartnerId(partnerId, query);
    }
    async getShowtimeDetail(partnerId, showtimeId) {
        const showtime = await this.showtimeRepo.findByIdAndPartnerId(showtimeId, partnerId);
        if (!showtime)
            throw new Error("Showtime not found");
        return showtime;
    }
    async updateShowtime(partnerId, showtimeId, data) {
        const showtime = await this.showtimeRepo.findByIdAndPartnerId(showtimeId, partnerId);
        if (!showtime)
            throw new Error("Showtime not found");
        if (showtime.status !== "SCHEDULED")
            throw new Error("Only SCHEDULED showtimes can be updated");
        await this.showtimeRepo.update(showtimeId, { ...data, updatedAt: new Date() });
        return true;
    }
    async cancelShowtime(partnerId, showtimeId) {
        const showtime = await this.showtimeRepo.findByIdAndPartnerId(showtimeId, partnerId);
        if (!showtime)
            throw new Error("Showtime not found");
        if (showtime.status === "CANCELLED")
            throw new Error("Showtime is already cancelled");
        if (showtime.status === "ENDED")
            throw new Error("Cannot cancel an ended showtime");
        const tickets = await this.ticketRepo.findByShowtimeId(showtimeId);
        const soldTickets = tickets.filter((t) => t.status === "CONFIRMED" || t.status === "RESERVED");
        for (const ticket of soldTickets) {
            await this.ticketRepo.updateStatus(ticket.id, "REFUNDED");
            await this.seatRepo.updateStatus(ticket.seatId, model_1.SeatStatus.AVAILABLE);
            if (ticket.partnerAmount > 0) {
                await this.walletRepo.decrementBalance(partnerId, ticket.partnerAmount);
                const refundTx = {
                    id: (0, crypto_1.randomUUID)(),
                    partnerId,
                    type: model_1.TransactionType.REFUND,
                    amount: -ticket.partnerAmount,
                    status: model_1.TransactionStatus.COMPLETED,
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
exports.ShowtimeManagementUseCase = ShowtimeManagementUseCase;
