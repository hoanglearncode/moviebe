"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerDashboardUseCase = void 0;
class PartnerDashboardUseCase {
    constructor(walletRepo, transactionRepo, showtimeRepo, withdrawalRepo, ticketRepo) {
        this.walletRepo = walletRepo;
        this.transactionRepo = transactionRepo;
        this.showtimeRepo = showtimeRepo;
        this.withdrawalRepo = withdrawalRepo;
        this.ticketRepo = ticketRepo;
    }
    async getDashboardStats(partnerId) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const [wallet, revenue, activeShowtimes, pendingWithdrawals] = await Promise.all([
            this.walletRepo.findByPartnerId(partnerId),
            this.transactionRepo.findRevenueByPeriod(partnerId, thirtyDaysAgo, now),
            this.showtimeRepo.findByPartnerId(partnerId, {
                page: 1,
                limit: 1,
                status: "SCHEDULED",
                sortBy: "startTime",
                sortOrder: "asc",
            }),
            this.withdrawalRepo.findByPartnerId(partnerId, {
                page: 1,
                limit: 1,
                status: "PENDING",
            }),
        ]);
        const stats = {
            totalRevenue: revenue.amount,
            ticketsSold: revenue.count,
            occupancyRate: 0,
            avgSalesPerShowtime: activeShowtimes.total > 0 ? revenue.count / activeShowtimes.total : 0,
            activeShowtimes: activeShowtimes.total,
            pendingWithdrawals: pendingWithdrawals.total,
            walletBalance: wallet?.balance ?? 0,
        };
        return stats;
    }
    async getTopMovies(partnerId, limit = 5) {
        const tickets = await this.ticketRepo.findByPartnerId(partnerId, {
            page: 1,
            limit: 1000,
        });
        const movieRevenue = {};
        for (const ticket of tickets.items) {
            if (!movieRevenue[ticket.movieId]) {
                movieRevenue[ticket.movieId] = {
                    movieId: ticket.movieId,
                    totalRevenue: 0,
                    totalTickets: 0,
                };
            }
            if (ticket.status === "CONFIRMED" || ticket.status === "USED") {
                movieRevenue[ticket.movieId].totalRevenue += ticket.partnerAmount;
                movieRevenue[ticket.movieId].totalTickets += 1;
            }
        }
        return Object.values(movieRevenue)
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, limit);
    }
    async getOccupancyStats(partnerId, startDate, endDate) {
        const { items: showtimes, total } = await this.showtimeRepo.findByPartnerId(partnerId, {
            page: 1,
            limit: 1000,
            sortBy: "startTime",
            sortOrder: "asc",
            ...(startDate ? { startDate: startDate.toISOString() } : {}),
            ...(endDate ? { endDate: endDate.toISOString() } : {}),
        });
        if (showtimes.length === 0) {
            return { total: 0, averageOccupancy: 0, showtimes: [] };
        }
        const showtimeStats = showtimes.map((s) => ({
            showtimeId: s.id,
            movieId: s.movieId,
            startTime: s.startTime,
            totalSeats: s.totalSeats,
            bookedSeats: s.bookedSeats,
            availableSeats: s.availableSeats,
            occupancyRate: s.totalSeats > 0 ? s.bookedSeats / s.totalSeats : 0,
        }));
        const averageOccupancy = showtimeStats.reduce((sum, s) => sum + s.occupancyRate, 0) / showtimeStats.length;
        return {
            total,
            averageOccupancy: Math.round(averageOccupancy * 10000) / 10000,
            showtimes: showtimeStats,
        };
    }
}
exports.PartnerDashboardUseCase = PartnerDashboardUseCase;
