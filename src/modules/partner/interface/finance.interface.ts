import { IRepository } from "../../../share/interface";
import { Transaction, Withdrawal, PartnerWallet, WithdrawalListResponse } from "../model/model";
import { CreateWithdrawalDTO, ListWithdrawalsQueryDTO, RevenueQueryDTO } from "../model/dto";


export interface ITransactionRepository extends IRepository<
  Transaction,
  Partial<Transaction>,
  Partial<Transaction>
> {
  findByPartnerId(partnerId: string): Promise<Transaction[]>;
  findRevenueByPeriod(
    partnerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ amount: number; count: number }>;
  findByType(partnerId: string, type: string): Promise<Transaction[]>;
}

export interface IWithdrawalRepository extends IRepository<
  Withdrawal,
  Partial<Withdrawal>,
  Partial<Withdrawal>
> {
  findById(withdrawalId: string): Promise<Withdrawal | null>;
  findByPartnerId(
    partnerId: string,
    query: ListWithdrawalsQueryDTO,
  ): Promise<WithdrawalListResponse>;
  updateStatus(withdrawalId: string, status: string): Promise<boolean>;
}

export interface IWalletRepository extends IRepository<
  PartnerWallet,
  Partial<PartnerWallet>,
  Partial<PartnerWallet>
> {
  findByPartnerId(partnerId: string): Promise<PartnerWallet | null>;
  updateBalance(partnerId: string, amount: number): Promise<boolean>;
  incrementBalance(partnerId: string, amount: number): Promise<boolean>;
  decrementBalance(partnerId: string, amount: number): Promise<boolean>;
}

// ─── Notification Service Port ────────────────────────────────────────────────

export interface IPartnerNotificationService {
  sendWithdrawalPending(input: {
    userId?: string;
    email: string;
    amount: number;
    reference: string;
  }): Promise<void>;
  sendWithdrawalCompleted(input: {
    userId?: string;
    email: string;
    amount: number;
    reference: string;
  }): Promise<void>;
  sendWithdrawalFailed(input: {
    userId?: string;
    email: string;
    amount: number;
    reason: string;
  }): Promise<void>;
  sendMovieApproved(input: {
    userId?: string;
    email: string;
    movieTitle: string;
    movieId?: string;
  }): Promise<void>;
  sendMovieRejected(input: {
    userId?: string;
    email: string;
    movieTitle: string;
    movieId?: string;
    reason: string;
  }): Promise<void>;
  sendDailyRevenue(input: {
    userId?: string;
    email: string;
    revenue: number;
    date: string;
  }): Promise<void>;
}

// ─── Use-Case Port ────────────────────────────────────────────────────────────

export interface IPartnerFinanceUseCase {
  getWallet(partnerId: string): Promise<PartnerWallet>;
  getTransactions(partnerId: string): Promise<Transaction[]>;
  getRevenue(partnerId: string, query: RevenueQueryDTO): Promise<any>;
  getRevenueByMovie(partnerId: string, startDate?: Date, endDate?: Date): Promise<any>;
  createWithdrawal(partnerId: string, data: CreateWithdrawalDTO): Promise<{ withdrawalId: string }>;
  getWithdrawals(
    partnerId: string,
    query: ListWithdrawalsQueryDTO,
  ): Promise<WithdrawalListResponse>;
  getWithdrawalDetail(partnerId: string, withdrawalId: string): Promise<Withdrawal>;
}
