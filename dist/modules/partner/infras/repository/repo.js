"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletRepository = exports.CheckInRepository = exports.WithdrawalRepository = exports.TransactionRepository = exports.TicketRepository = exports.SeatRepository = exports.ShowtimeRepository = exports.MovieRepository = exports.PartnerRepository = void 0;
exports.createPartnerRepository = createPartnerRepository;
exports.createMovieRepository = createMovieRepository;
exports.createShowtimeRepository = createShowtimeRepository;
exports.createSeatRepository = createSeatRepository;
exports.createTicketRepository = createTicketRepository;
exports.createTransactionRepository = createTransactionRepository;
exports.createWithdrawalRepository = createWithdrawalRepository;
exports.createCheckInRepository = createCheckInRepository;
exports.createWalletRepository = createWalletRepository;
/**
 * ==========================================
 * PARTNER REPOSITORY
 * =========================================
 */
class PartnerRepository {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async findById(partnerId) {
        // TODO: Implement once Partner model is defined in Prisma
        // return this.prismaClient.partner.findUnique({ where: { id: partnerId } });
        return null;
    }
    async findByUserId(userId) {
        // TODO: Implement once Partner model is defined in Prisma
        return null;
    }
    async findByTaxCode(taxCode) {
        // TODO: Implement once Partner model is defined in Prisma
        return null;
    }
    async insert(data) {
        // TODO: Implement once Partner model is defined in Prisma
        return true;
    }
    async update(id, data) {
        // TODO: Implement once Partner model is defined in Prisma
        return true;
    }
    async delete(id) {
        // TODO: Implement once Partner model is defined in Prisma
        return true;
    }
}
exports.PartnerRepository = PartnerRepository;
/**
 * ==========================================
 * MOVIE REPOSITORY
 * ==========================================
 */
class MovieRepository {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async findById(movieId) {
        // TODO: Implement once Movie model is defined in Prisma
        return null;
    }
    async findByPartnerId(partnerId, query) {
        // TODO: Implement once Movie model is defined in Prisma
        return { data: [], total: 0 };
    }
    async findByIdAndPartnerId(movieId, partnerId) {
        // TODO: Implement once Movie model is defined in Prisma
        return null;
    }
    async updateStatus(movieId, status) {
        // TODO: Implement once Movie model is defined in Prisma
        return true;
    }
    async insert(data) {
        // TODO: Implement once Movie model is defined in Prisma
        return true;
    }
    async update(id, data) {
        // TODO: Implement once Movie model is defined in Prisma
        return true;
    }
    async delete(id) {
        // TODO: Implement once Movie model is defined in Prisma
        return true;
    }
}
exports.MovieRepository = MovieRepository;
/**
 * ==========================================
 * SHOWTIME REPOSITORY
 * ==========================================
 */
class ShowtimeRepository {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async findById(showtimeId) {
        // TODO: Implement once Showtime model is defined in Prisma
        return null;
    }
    async findByPartnerId(partnerId, query) {
        // TODO: Implement once Showtime model is defined in Prisma
        return { data: [], total: 0 };
    }
    async findByIdAndPartnerId(showtimeId, partnerId) {
        // TODO: Implement once Showtime model is defined in Prisma
        return null;
    }
    async insert(data) {
        // TODO: Implement once Showtime model is defined in Prisma
        return true;
    }
    async update(id, data) {
        // TODO: Implement once Showtime model is defined in Prisma
        return true;
    }
    async delete(id) {
        // TODO: Implement once Showtime model is defined in Prisma
        return true;
    }
    async updateStatus(showtimeId, status) {
        // TODO: Implement once Showtime model is defined in Prisma
        return true;
    }
}
exports.ShowtimeRepository = ShowtimeRepository;
/**
 * ==========================================
 * SEAT REPOSITORY
 * ==========================================
 */
class SeatRepository {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async findById(seatId) {
        // TODO: Implement once Seat model is defined in Prisma
        return null;
    }
    async findByShowtimeId(showtimeId) {
        // TODO: Implement once Seat model is defined in Prisma
        return [];
    }
    async insert(data) {
        // TODO: Implement once Seat model is defined in Prisma
        return true;
    }
    async update(id, data) {
        // TODO: Implement once Seat model is defined in Prisma
        return true;
    }
    async delete(id) {
        // TODO: Implement once Seat model is defined in Prisma
        return true;
    }
    async updateBulkStatus(seatIds, status) {
        // TODO: Implement once Seat model is defined in Prisma
        return true;
    }
}
exports.SeatRepository = SeatRepository;
/**
 * ==========================================
 * TICKET REPOSITORY
 * ==========================================
 */
class TicketRepository {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async findById(ticketId) {
        // TODO: Implement once Ticket model is defined in Prisma
        return null;
    }
    async findByPartnerId(partnerId, query) {
        // TODO: Implement once Ticket model is defined in Prisma
        return { data: [], total: 0 };
    }
    async findByIdAndPartnerId(ticketId, partnerId) {
        // TODO: Implement once Ticket model is defined in Prisma
        return null;
    }
    async findByQRCode(qrCode) {
        // TODO: Implement once Ticket model is defined in Prisma
        return null;
    }
    async insert(data) {
        // TODO: Implement once Ticket model is defined in Prisma
        return true;
    }
    async update(id, data) {
        // TODO: Implement once Ticket model is defined in Prisma
        return true;
    }
    async delete(id) {
        // TODO: Implement once Ticket model is defined in Prisma
        return true;
    }
}
exports.TicketRepository = TicketRepository;
/**
 * ==========================================
 * TRANSACTION REPOSITORY
 * ==========================================
 */
class TransactionRepository {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async findById(transactionId) {
        // TODO: Implement once Transaction model is defined in Prisma
        return null;
    }
    async findByPartnerId(partnerId) {
        // TODO: Implement once Transaction model is defined in Prisma
        return [];
    }
    async findRevenueByPeriod(partnerId, startDate, endDate) {
        // TODO: Implement aggregation query once Transaction model is defined
        return 0;
    }
    async insert(data) {
        // TODO: Implement once Transaction model is defined in Prisma
        return true;
    }
    async update(id, data) {
        // TODO: Implement once Transaction model is defined in Prisma
        return true;
    }
    async delete(id) {
        // TODO: Implement once Transaction model is defined in Prisma
        return true;
    }
}
exports.TransactionRepository = TransactionRepository;
/**
 * ==========================================
 * WITHDRAWAL REPOSITORY
 * ==========================================
 */
class WithdrawalRepository {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async findById(withdrawalId) {
        // TODO: Implement once Withdrawal model is defined in Prisma
        return null;
    }
    async findByPartnerId(partnerId, query) {
        // TODO: Implement once Withdrawal model is defined in Prisma
        return { data: [], total: 0 };
    }
    async findByIdAndPartnerId(withdrawalId, partnerId) {
        // TODO: Implement once Withdrawal model is defined in Prisma
        return null;
    }
    async insert(data) {
        // TODO: Implement once Withdrawal model is defined in Prisma
        return true;
    }
    async update(id, data) {
        // TODO: Implement once Withdrawal model is defined in Prisma
        return true;
    }
    async delete(id) {
        // TODO: Implement once Withdrawal model is defined in Prisma
        return true;
    }
}
exports.WithdrawalRepository = WithdrawalRepository;
/**
 * ==========================================
 * CHECK-IN REPOSITORY
 * ==========================================
 */
class CheckInRepository {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async findById(checkInId) {
        // TODO: Implement once CheckIn model is defined in Prisma
        return null;
    }
    async findByShowtimeId(showtimeId) {
        // TODO: Implement once CheckIn model is defined in Prisma
        return [];
    }
    async countByShowtimeId(showtimeId) {
        // TODO: Implement count query once CheckIn model is defined
        return 0;
    }
    async insert(data) {
        // TODO: Implement once CheckIn model is defined in Prisma
        return true;
    }
    async update(id, data) {
        // TODO: Implement once CheckIn model is defined in Prisma
        return true;
    }
    async delete(id) {
        // TODO: Implement once CheckIn model is defined in Prisma
        return true;
    }
}
exports.CheckInRepository = CheckInRepository;
/**
 * ==========================================
 * WALLET REPOSITORY
 * ==========================================
 */
class WalletRepository {
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async findById(walletId) {
        // TODO: Implement once PartnerWallet model is defined in Prisma
        return null;
    }
    async findByPartnerId(partnerId) {
        // TODO: Implement once PartnerWallet model is defined in Prisma
        return null;
    }
    async incrementBalance(partnerId, amount) {
        // TODO: Implement balance increment once PartnerWallet model is defined
        return true;
    }
    async decrementBalance(partnerId, amount) {
        // TODO: Implement balance decrement once PartnerWallet model is defined
        return true;
    }
    async insert(data) {
        // TODO: Implement once PartnerWallet model is defined in Prisma
        return true;
    }
    async update(id, data) {
        // TODO: Implement once PartnerWallet model is defined in Prisma
        return true;
    }
    async delete(id) {
        // TODO: Implement once PartnerWallet model is defined in Prisma
        return true;
    }
}
exports.WalletRepository = WalletRepository;
/**
 * ==========================================
 * FACTORY FUNCTIONS FOR DEPENDENCY INJECTION
 * ==========================================
 */
function createPartnerRepository(prismaClient) {
    return new PartnerRepository(prismaClient);
}
function createMovieRepository(prismaClient) {
    return new MovieRepository(prismaClient);
}
function createShowtimeRepository(prismaClient) {
    return new ShowtimeRepository(prismaClient);
}
function createSeatRepository(prismaClient) {
    return new SeatRepository(prismaClient);
}
function createTicketRepository(prismaClient) {
    return new TicketRepository(prismaClient);
}
function createTransactionRepository(prismaClient) {
    return new TransactionRepository(prismaClient);
}
function createWithdrawalRepository(prismaClient) {
    return new WithdrawalRepository(prismaClient);
}
function createCheckInRepository(prismaClient) {
    return new CheckInRepository(prismaClient);
}
function createWalletRepository(prismaClient) {
    return new WalletRepository(prismaClient);
}
