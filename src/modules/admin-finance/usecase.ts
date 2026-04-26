import { PrismaClient, WithdrawalStatus } from "@prisma/client";

export class AdminFinanceUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async getSummary(period: "7d" | "30d" | "90d" | "12m" = "12m") {
    const startDate = this.periodToStart(period);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalRevenue,
      totalPayout,
      revenueThisMonth,
      revenuePrevMonth,
      payoutThisMonth,
      pendingWithdrawals,
      processingWithdrawals,
      completedWithdrawals,
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { type: "TICKET_SALE", status: "COMPLETED", createdAt: { gte: startDate } },
        _sum: { amount: true },
      }),
      this.prisma.withdrawal.aggregate({
        where: {
          status: { in: ["COMPLETED"] },
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
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
      this.prisma.withdrawal.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.withdrawal.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.withdrawal.aggregate({
        where: { status: "PROCESSING" },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.withdrawal.aggregate({
        where: { status: "COMPLETED", createdAt: { gte: startDate } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const grossRevenue = totalRevenue._sum.amount ?? 0;
    const totalPayoutAmount = totalPayout._sum.amount ?? 0;
    const netRevenue = grossRevenue - totalPayoutAmount;
    const thisMonthRevenue = revenueThisMonth._sum.amount ?? 0;
    const prevMonthRevenue = revenuePrevMonth._sum.amount ?? 0;
    const revenueGrowth =
      prevMonthRevenue > 0
        ? Math.round(((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
        : 0;

    return {
      period,
      grossRevenue,
      totalPayout: totalPayoutAmount,
      netRevenue,
      revenueThisMonth: thisMonthRevenue,
      revenuePrevMonth: prevMonthRevenue,
      revenueGrowth,
      payoutThisMonth: payoutThisMonth._sum.amount ?? 0,
      pendingWithdrawals: {
        count: pendingWithdrawals._count,
        amount: pendingWithdrawals._sum.amount ?? 0,
      },
      processingWithdrawals: {
        count: processingWithdrawals._count,
        amount: processingWithdrawals._sum.amount ?? 0,
      },
      completedWithdrawals: {
        count: completedWithdrawals._count,
        amount: completedWithdrawals._sum.amount ?? 0,
      },
    };
  }

  async getRevenueTrend(period: "7d" | "30d" | "90d" | "12m" = "12m") {
    const startDate = this.periodToStart(period);
    const groupBy = period === "12m" ? "MONTH" : "DAY";

    const transactions = await this.prisma.transaction.findMany({
      where: {
        type: "TICKET_SALE",
        status: "COMPLETED",
        createdAt: { gte: startDate },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const withdrawals = await this.prisma.withdrawal.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: startDate },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const revBuckets: Record<string, number> = {};
    const payoutBuckets: Record<string, number> = {};

    for (const t of transactions) {
      const key =
        groupBy === "DAY"
          ? t.createdAt.toISOString().slice(0, 10)
          : t.createdAt.toISOString().slice(0, 7);
      revBuckets[key] = (revBuckets[key] ?? 0) + t.amount;
    }

    for (const w of withdrawals) {
      const key =
        groupBy === "DAY"
          ? w.createdAt.toISOString().slice(0, 10)
          : w.createdAt.toISOString().slice(0, 7);
      payoutBuckets[key] = (payoutBuckets[key] ?? 0) + w.amount;
    }

    const allKeys = new Set([...Object.keys(revBuckets), ...Object.keys(payoutBuckets)]);
    const data = Array.from(allKeys)
      .sort()
      .map((label) => {
        const revenue = revBuckets[label] ?? 0;
        const payout = payoutBuckets[label] ?? 0;
        return {
          label,
          revenue,
          payout,
          net: revenue - payout,
        };
      });

    return { period, groupBy, data };
  }

  async getTransactions(query: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    partnerId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.partnerId) where.partnerId = query.partnerId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [total, items] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          partner: { select: { cinemaName: true, id: true } },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getWithdrawals(query: {
    page?: number;
    limit?: number;
    status?: string;
    partnerId?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.partnerId) where.partnerId = query.partnerId;

    const [total, items] = await Promise.all([
      this.prisma.withdrawal.count({ where }),
      this.prisma.withdrawal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          partner: { select: { cinemaName: true, id: true, email: true } },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approveWithdrawal(withdrawalId: string, adminId: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) throw new Error("Withdrawal not found");
    if (withdrawal.status !== "PENDING") throw new Error("Withdrawal is not in PENDING status");

    await this.prisma.$transaction([
      this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: WithdrawalStatus.PROCESSING,
          processedAt: new Date(),
        },
      }),
      this.prisma.transaction.updateMany({
        where: { withdrawalId },
        data: { status: "PENDING" },
      }),
    ]);

    return { message: "Withdrawal approved and processing" };
  }

  async completeWithdrawal(withdrawalId: string, transactionReference?: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) throw new Error("Withdrawal not found");
    if (!["PENDING", "PROCESSING"].includes(withdrawal.status)) {
      throw new Error("Withdrawal cannot be completed in current status");
    }

    await this.prisma.$transaction([
      this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: WithdrawalStatus.COMPLETED,
          processedAt: new Date(),
          transactionReference: transactionReference ?? null,
        },
      }),
      this.prisma.transaction.updateMany({
        where: { withdrawalId },
        data: { status: "COMPLETED" },
      }),
    ]);

    return { message: "Withdrawal completed" };
  }

  async rejectWithdrawal(withdrawalId: string, reason: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { partner: { select: { id: true } } },
    });

    if (!withdrawal) throw new Error("Withdrawal not found");
    if (!["PENDING", "PROCESSING"].includes(withdrawal.status)) {
      throw new Error("Withdrawal cannot be rejected in current status");
    }

    await this.prisma.$transaction([
      this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: WithdrawalStatus.FAILED,
          failureReason: reason,
        },
      }),
      this.prisma.transaction.updateMany({
        where: { withdrawalId },
        data: { status: "FAILED" },
      }),
      this.prisma.partnerWallet.update({
        where: { partnerId: withdrawal.partnerId },
        data: { balance: { increment: withdrawal.amount } },
      }),
    ]);

    return { message: "Withdrawal rejected and amount returned to wallet" };
  }

  async getPlanDistribution() {
    const [totalUsers, freeUsers, paidOrders] = await Promise.all([
      this.prisma.user.count({ where: { role: "USER" } }),
      this.prisma.user.count({ where: { role: "USER", status: "ACTIVE" } }),
      this.prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalUsers,
      freeUsers,
      paidOrders,
    };
  }

  private periodToStart(period: string): Date {
    const now = new Date();
    switch (period) {
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "90d":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case "12m":
      default:
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }
  }
}
