import { PrismaClient } from "@prisma/client";

type Period = "7d" | "30d" | "90d" | "1y";

export class AdminAnalyticsUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async getOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers,
      newUsersThisMonth,
      activePartners,
      pendingPartnerRequests,
      activeMovies,
      pendingMovies,
      revenueThisMonth,
      revenuePrevMonth,
      ticketsSoldThisMonth,
      pendingWithdrawals,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: "USER" } }),
      this.prisma.user.count({
        where: { role: "USER", createdAt: { gte: startOfMonth } },
      }),
      this.prisma.partner.count({ where: { status: "ACTIVE" } }),
      this.prisma.partnerRequest.count({ where: { status: "PENDING" } }),
      this.prisma.movie.count({ where: { status: "ACTIVE" } }),
      this.prisma.movie.count({ where: { status: "SUBMITTED" } }),
      this.prisma.transaction.aggregate({
        where: {
          type: "TICKET_SALE",
          status: "COMPLETED",
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          type: "TICKET_SALE",
          status: "COMPLETED",
          createdAt: { gte: startOfPrevMonth, lt: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.ticket.count({
        where: {
          status: { in: ["CONFIRMED", "USED"] },
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.withdrawal.count({ where: { status: "PENDING" } }),
    ]);

    const thisMonthRevenue = revenueThisMonth._sum.amount ?? 0;
    const prevMonthRevenue = revenuePrevMonth._sum.amount ?? 0;
    const revenueGrowth =
      prevMonthRevenue > 0
        ? Math.round(((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
        : 0;

    return {
      totalUsers,
      newUsersThisMonth,
      activePartners,
      pendingPartnerRequests,
      activeMovies,
      pendingMovies,
      revenueThisMonth: thisMonthRevenue,
      revenuePrevMonth: prevMonthRevenue,
      revenueGrowth,
      ticketsSoldThisMonth,
      pendingWithdrawals,
    };
  }

  async getRevenueTrend(period: Period) {
    const { startDate, groupBy } = this.periodToRange(period);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        type: "TICKET_SALE",
        status: "COMPLETED",
        createdAt: { gte: startDate },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const buckets: Record<string, { revenue: number; count: number }> = {};
    for (const t of transactions) {
      const key =
        groupBy === "DAY"
          ? t.createdAt.toISOString().slice(0, 10)
          : t.createdAt.toISOString().slice(0, 7);
      if (!buckets[key]) buckets[key] = { revenue: 0, count: 0 };
      buckets[key].revenue += t.amount;
      buckets[key].count += 1;
    }

    return {
      period,
      groupBy,
      data: Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, stats]) => ({ label, ...stats })),
    };
  }

  async getUserTrend(period: Period) {
    const { startDate, groupBy } = this.periodToRange(period);

    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, role: true },
      orderBy: { createdAt: "asc" },
    });

    const buckets: Record<string, { total: number; users: number; partners: number }> = {};
    for (const u of users) {
      const key =
        groupBy === "DAY"
          ? u.createdAt.toISOString().slice(0, 10)
          : u.createdAt.toISOString().slice(0, 7);
      if (!buckets[key]) buckets[key] = { total: 0, users: 0, partners: 0 };
      buckets[key].total += 1;
      if (u.role === "USER") buckets[key].users += 1;
      if (u.role === "PARTNER") buckets[key].partners += 1;
    }

    return {
      period,
      groupBy,
      data: Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, stats]) => ({ label, ...stats })),
    };
  }

  async getContentStats() {
    const [moviesByStatus, totalReviews, avgRating, topPartners] = await Promise.all([
      this.prisma.movie.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      this.prisma.review.count({ where: { status: "APPROVED" } }),
      this.prisma.review.aggregate({
        where: { status: "APPROVED" },
        _avg: { score: true },
      }),
      this.prisma.partner.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          cinemaName: true,
          city: true,
          logo: true,
          _count: { select: { movies: true, showtimes: true } },
        },
      }),
    ]);

    return {
      moviesByStatus: moviesByStatus.map((m) => ({
        status: m.status,
        count: m._count._all,
      })),
      totalReviews,
      avgRating: avgRating._avg.score ?? 0,
      topPartners,
    };
  }

  async getSystemHealth() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [recentOrders, recentPayments, totalOrders] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: oneHourAgo } } }),
      this.prisma.order.count({
        where: { status: "COMPLETED", createdAt: { gte: oneHourAgo } },
      }),
      this.prisma.order.count(),
    ]);

    return {
      status: "operational",
      metrics: {
        recentOrdersPerHour: recentOrders,
        recentPaymentsPerHour: recentPayments,
        successRate: recentOrders > 0 ? Math.round((recentPayments / recentOrders) * 100) : 100,
        totalOrders,
      },
      timestamp: now.toISOString(),
    };
  }

  private periodToRange(period: Period): { startDate: Date; groupBy: "DAY" | "MONTH" } {
    const now = new Date();
    let startDate: Date;
    let groupBy: "DAY" | "MONTH" = "DAY";

    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        groupBy = "MONTH";
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, groupBy };
  }
}
