"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerFinanceUseCase = void 0;
const crypto_1 = require("crypto");
const model_1 = require("../model/model");
class PartnerFinanceUseCase {
    constructor(walletRepo, transactionRepo, withdrawalRepo, partnerRepo, notificationSvc) {
        this.walletRepo = walletRepo;
        this.transactionRepo = transactionRepo;
        this.withdrawalRepo = withdrawalRepo;
        this.partnerRepo = partnerRepo;
        this.notificationSvc = notificationSvc;
    }
    async getWallet(partnerId) {
        let wallet = await this.walletRepo.findByPartnerId(partnerId);
        if (!wallet) {
            const newWallet = {
                id: (0, crypto_1.randomUUID)(),
                partnerId,
                balance: 0,
                totalEarned: 0,
                totalWithdrawn: 0,
                totalRefunded: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            await this.walletRepo.insert(newWallet);
            wallet = await this.walletRepo.findByPartnerId(partnerId);
            if (!wallet)
                throw new Error("Failed to create wallet");
        }
        return wallet;
    }
    async getTransactions(partnerId) {
        return this.transactionRepo.findByPartnerId(partnerId);
    }
    async getRevenue(partnerId, query) {
        const startDate = new Date(query.startDate);
        const endDate = new Date(query.endDate);
        if (query.groupBy === "MOVIE") {
            return this.getRevenueByMovie(partnerId, startDate, endDate);
        }
        const revenue = await this.transactionRepo.findRevenueByPeriod(partnerId, startDate, endDate);
        const transactions = await this.transactionRepo.findByType(partnerId, model_1.TransactionType.TICKET_SALE);
        const filtered = transactions.filter((t) => t.createdAt >= startDate && t.createdAt <= endDate);
        const keyFn = (t) => query.groupBy === "DAY"
            ? t.createdAt.toISOString().slice(0, 10)
            : t.createdAt.toISOString().slice(0, 7);
        const buckets = {};
        for (const t of filtered) {
            const key = keyFn(t);
            if (!buckets[key])
                buckets[key] = { amount: 0, count: 0 };
            buckets[key].amount += t.amount;
            buckets[key].count += 1;
        }
        return {
            groupBy: query.groupBy,
            totalRevenue: revenue.amount,
            totalTickets: revenue.count,
            startDate: query.startDate,
            endDate: query.endDate,
            data: Object.entries(buckets)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([period, stats]) => ({ period, ...stats })),
        };
    }
    async getRevenueByMovie(partnerId, startDate, endDate) {
        const transactions = await this.transactionRepo.findByType(partnerId, model_1.TransactionType.TICKET_SALE);
        const filtered = transactions.filter((t) => {
            if (startDate && t.createdAt < startDate)
                return false;
            if (endDate && t.createdAt > endDate)
                return false;
            return true;
        });
        const byRelated = {};
        for (const t of filtered) {
            const key = t.ticketId ?? "unknown";
            if (!byRelated[key])
                byRelated[key] = { amount: 0, count: 0 };
            byRelated[key].amount += t.amount;
            byRelated[key].count += 1;
        }
        const totalRevenue = filtered.reduce((sum, t) => sum + t.amount, 0);
        return {
            groupBy: "MOVIE",
            totalRevenue,
            totalTickets: filtered.length,
            startDate,
            endDate,
            data: Object.entries(byRelated).map(([relatedId, stats]) => ({ relatedId, ...stats })),
        };
    }
    async createWithdrawal(partnerId, data) {
        const wallet = await this.getWallet(partnerId);
        if (wallet.balance < data.amount)
            throw new Error(`Insufficient balance. Available: ${wallet.balance}, Requested: ${data.amount}`);
        await this.walletRepo.decrementBalance(partnerId, data.amount);
        const withdrawalId = (0, crypto_1.randomUUID)();
        const now = new Date();
        const withdrawal = {
            id: withdrawalId,
            partnerId,
            amount: data.amount,
            bankAccountNumber: data.bankAccountNumber,
            bankName: data.bankName,
            bankCode: data.bankCode,
            status: model_1.WithdrawalStatus.PENDING,
            transactionReference: null,
            failureReason: null,
            processedAt: null,
            createdAt: now,
            updatedAt: now,
        };
        await this.withdrawalRepo.insert(withdrawal);
        const transaction = {
            id: (0, crypto_1.randomUUID)(),
            partnerId,
            type: model_1.TransactionType.WITHDRAWAL,
            amount: -data.amount,
            status: model_1.TransactionStatus.PENDING,
            withdrawalId,
            description: data.note ?? `Withdrawal to ${data.bankName} - ${data.bankAccountNumber}`,
            createdAt: now,
            updatedAt: now,
        };
        await this.transactionRepo.insert(transaction);
        const partner = await this.partnerRepo.findById(partnerId);
        if (partner) {
            this.notificationSvc
                .sendWithdrawalPending({
                userId: partner.userId,
                email: partner.email,
                amount: data.amount,
                reference: withdrawalId,
            })
                .catch(() => { });
        }
        return { withdrawalId };
    }
    async getWithdrawals(partnerId, query) {
        return this.withdrawalRepo.findByPartnerId(partnerId, query);
    }
    async getWithdrawalDetail(partnerId, withdrawalId) {
        const withdrawal = await this.withdrawalRepo.findById(withdrawalId);
        if (!withdrawal)
            throw new Error("Withdrawal not found");
        if (withdrawal.partnerId !== partnerId)
            throw new Error("Withdrawal does not belong to this partner");
        return withdrawal;
    }
}
exports.PartnerFinanceUseCase = PartnerFinanceUseCase;
