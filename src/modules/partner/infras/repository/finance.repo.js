"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWalletRepository = exports.createWithdrawalRepository = exports.createTransactionRepository = exports.WalletRepository = exports.WithdrawalRepository = exports.TransactionRepository = void 0;
class TransactionRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async get(_id) {
        return null;
    }
    async list(_cond, _paging) {
        return [];
    }
    async findByCond(_cond) {
        return null;
    }
    async findByPartnerId(partnerId) {
        const rows = await this.prisma.transaction.findMany({
            where: { partnerId },
            orderBy: { createdAt: "desc" },
        });
        return rows;
    }
    async findRevenueByPeriod(partnerId, startDate, endDate) {
        const result = await this.prisma.transaction.aggregate({
            where: { partnerId, type: "TICKET_SALE", createdAt: { gte: startDate, lte: endDate } },
            _sum: { amount: true },
            _count: { id: true },
        });
        return { amount: result._sum.amount ?? 0, count: result._count.id ?? 0 };
    }
    async findByType(partnerId, type) {
        const rows = await this.prisma.transaction.findMany({
            where: { partnerId, type: type },
            orderBy: { createdAt: "desc" },
        });
        return rows;
    }
    async insert(data) {
        await this.prisma.transaction.create({ data: data });
        return true;
    }
    async update(id, data) {
        await this.prisma.transaction.update({ where: { id }, data: data });
        return true;
    }
    async delete(id, _isHard = false) {
        await this.prisma.transaction.delete({ where: { id } });
        return true;
    }
}
exports.TransactionRepository = TransactionRepository;
// ─── Withdrawal Repository ────────────────────────────────────────────────────
class WithdrawalRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async get(_id) {
        return null;
    }
    async list(_cond, _paging) {
        return [];
    }
    async findByCond(_cond) {
        return null;
    }
    async findById(withdrawalId) {
        const row = await this.prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
        return row ? row : null;
    }
    async findByPartnerId(partnerId, query) {
        const { page = 1, limit = 20, status, startDate, endDate } = query;
        const skip = (page - 1) * limit;
        const where = { partnerId };
        if (status)
            where.status = status;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
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
            items: rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async updateStatus(withdrawalId, status) {
        await this.prisma.withdrawal.update({
            where: { id: withdrawalId },
            data: {
                status: status,
                ...(status === "COMPLETED" || status === "FAILED" ? { processedAt: new Date() } : {}),
            },
        });
        return true;
    }
    async insert(data) {
        await this.prisma.withdrawal.create({ data: data });
        return true;
    }
    async update(id, data) {
        await this.prisma.withdrawal.update({ where: { id }, data: data });
        return true;
    }
    async delete(id, _isHard = false) {
        await this.prisma.withdrawal.delete({ where: { id } });
        return true;
    }
}
exports.WithdrawalRepository = WithdrawalRepository;
// ─── Wallet Repository ────────────────────────────────────────────────────────
class WalletRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async get(_id) {
        return null;
    }
    async list(_cond, _paging) {
        return [];
    }
    async findByCond(_cond) {
        return null;
    }
    async findByPartnerId(partnerId) {
        const row = await this.prisma.partnerWallet.findUnique({ where: { partnerId } });
        return row ? row : null;
    }
    async updateBalance(partnerId, amount) {
        await this.prisma.partnerWallet.update({
            where: { partnerId },
            data: { balance: amount },
        });
        return true;
    }
    async incrementBalance(partnerId, amount) {
        await this.prisma.partnerWallet.update({
            where: { partnerId },
            data: { balance: { increment: amount }, totalEarned: { increment: amount } },
        });
        return true;
    }
    async decrementBalance(partnerId, amount) {
        await this.prisma.partnerWallet.update({
            where: { partnerId },
            data: { balance: { decrement: amount }, totalWithdrawn: { increment: amount } },
        });
        return true;
    }
    async insert(data) {
        await this.prisma.partnerWallet.create({ data: data });
        return true;
    }
    async update(id, data) {
        await this.prisma.partnerWallet.update({ where: { id }, data: data });
        return true;
    }
    async delete(id, _isHard = false) {
        await this.prisma.partnerWallet.delete({ where: { id } });
        return true;
    }
}
exports.WalletRepository = WalletRepository;
// ─── Factories ────────────────────────────────────────────────────────────────
const createTransactionRepository = (prisma) => new TransactionRepository(prisma);
exports.createTransactionRepository = createTransactionRepository;
const createWithdrawalRepository = (prisma) => new WithdrawalRepository(prisma);
exports.createWithdrawalRepository = createWithdrawalRepository;
const createWalletRepository = (prisma) => new WalletRepository(prisma);
exports.createWalletRepository = createWalletRepository;
