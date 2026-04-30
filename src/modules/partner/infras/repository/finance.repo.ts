import { PrismaClient } from "@prisma/client";
import {
  ITransactionRepository,
  IWithdrawalRepository,
  IWalletRepository,
} from "@/modules/partner/interface/finance.interface";
import { Transaction, Withdrawal, PartnerWallet, WithdrawalListResponse } from "@/modules/partner/model/model";
import { ListWithdrawalsQueryDTO } from "@/modules/partner/model/dto";
import { PagingDTO } from "@/share";

export class TransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(_id: string): Promise<Transaction | null> {
    return null;
  }
  async list(_cond: Partial<Transaction>, _paging: PagingDTO): Promise<Transaction[]> {
    return [];
  }
  async findByCond(_cond: Partial<Transaction>): Promise<Transaction | null> {
    return null;
  }

  async findByPartnerId(partnerId: string): Promise<Transaction[]> {
    const rows = await this.prisma.transaction.findMany({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
    });
    return rows as unknown as Transaction[];
  }

  async findRevenueByPeriod(
    partnerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ amount: number; count: number }> {
    const result = await this.prisma.transaction.aggregate({
      where: { partnerId, type: "TICKET_SALE", createdAt: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      _count: { id: true },
    });
    return { amount: result._sum.amount ?? 0, count: result._count.id ?? 0 };
  }

  async findByType(partnerId: string, type: string): Promise<Transaction[]> {
    const rows = await this.prisma.transaction.findMany({
      where: { partnerId, type: type as any },
      orderBy: { createdAt: "desc" },
    });
    return rows as unknown as Transaction[];
  }

  async insert(data: Transaction): Promise<boolean> {
    await this.prisma.transaction.create({ data: data as any });
    return true;
  }

  async update(id: string, data: Partial<Transaction>): Promise<boolean> {
    await this.prisma.transaction.update({ where: { id }, data: data as any });
    return true;
  }

  async delete(id: string, _isHard = false): Promise<boolean> {
    await this.prisma.transaction.delete({ where: { id } });
    return true;
  }
}

// ─── Withdrawal Repository ────────────────────────────────────────────────────

export class WithdrawalRepository implements IWithdrawalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(_id: string): Promise<Withdrawal | null> {
    return null;
  }
  async list(_cond: Partial<Withdrawal>, _paging: PagingDTO): Promise<Withdrawal[]> {
    return [];
  }
  async findByCond(_cond: Partial<Withdrawal>): Promise<Withdrawal | null> {
    return null;
  }

  async findById(withdrawalId: string): Promise<Withdrawal | null> {
    const row = await this.prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
    return row ? (row as unknown as Withdrawal) : null;
  }

  async findByPartnerId(
    partnerId: string,
    query: ListWithdrawalsQueryDTO,
  ): Promise<WithdrawalListResponse> {
    const { page = 1, limit = 20, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;
    const where: any = { partnerId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [rows, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    return {
      items: rows as unknown as Withdrawal[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStatus(withdrawalId: string, status: string): Promise<boolean> {
    await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: status as any,
        ...(status === "COMPLETED" || status === "FAILED" ? { processedAt: new Date() } : {}),
      },
    });
    return true;
  }

  async insert(data: Withdrawal): Promise<boolean> {
    await this.prisma.withdrawal.create({ data: data as any });
    return true;
  }

  async update(id: string, data: Partial<Withdrawal>): Promise<boolean> {
    await this.prisma.withdrawal.update({ where: { id }, data: data as any });
    return true;
  }

  async delete(id: string, _isHard = false): Promise<boolean> {
    await this.prisma.withdrawal.delete({ where: { id } });
    return true;
  }
}

// ─── Wallet Repository ────────────────────────────────────────────────────────

export class WalletRepository implements IWalletRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(_id: string): Promise<PartnerWallet | null> {
    return null;
  }
  async list(_cond: Partial<PartnerWallet>, _paging: PagingDTO): Promise<PartnerWallet[]> {
    return [];
  }
  async findByCond(_cond: Partial<PartnerWallet>): Promise<PartnerWallet | null> {
    return null;
  }

  async findByPartnerId(partnerId: string): Promise<PartnerWallet | null> {
    const row = await this.prisma.partnerWallet.findUnique({ where: { partnerId } });
    return row ? (row as unknown as PartnerWallet) : null;
  }

  async updateBalance(partnerId: string, amount: number): Promise<boolean> {
    await this.prisma.partnerWallet.update({
      where: { partnerId },
      data: { balance: amount },
    });
    return true;
  }

  async incrementBalance(partnerId: string, amount: number): Promise<boolean> {
    await this.prisma.partnerWallet.update({
      where: { partnerId },
      data: { balance: { increment: amount }, totalEarned: { increment: amount } },
    });
    return true;
  }

  async decrementBalance(partnerId: string, amount: number): Promise<boolean> {
    await this.prisma.partnerWallet.update({
      where: { partnerId },
      data: { balance: { decrement: amount }, totalWithdrawn: { increment: amount } },
    });
    return true;
  }

  async insert(data: PartnerWallet): Promise<boolean> {
    await this.prisma.partnerWallet.create({ data: data as any });
    return true;
  }

  async update(id: string, data: Partial<PartnerWallet>): Promise<boolean> {
    await this.prisma.partnerWallet.update({ where: { id }, data: data as any });
    return true;
  }

  async delete(id: string, _isHard = false): Promise<boolean> {
    await this.prisma.partnerWallet.delete({ where: { id } });
    return true;
  }
}

// ─── Factories ────────────────────────────────────────────────────────────────

export const createTransactionRepository = (prisma: PrismaClient): ITransactionRepository =>
  new TransactionRepository(prisma);

export const createWithdrawalRepository = (prisma: PrismaClient): IWithdrawalRepository =>
  new WithdrawalRepository(prisma);

export const createWalletRepository = (prisma: PrismaClient): IWalletRepository =>
  new WalletRepository(prisma);
