import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../../share/transport/http-server";
import { IPartnerFinanceUseCase } from "../../interface";
import {
  CreateWithdrawalDTO,
  ListWithdrawalsQueryDTO,
  RevenueQueryDTO,
} from "../../model/dto";



export class PartnerFinanceHttpService {
  constructor(private useCase: IPartnerFinanceUseCase) {}

  async getWallet(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const wallet = await this.useCase.getWallet(partnerId);
      successResponse(res, wallet, "Wallet retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const transactions = await this.useCase.getTransactions(partnerId);
      successResponse(res, transactions, "Transactions retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async getRevenue(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const query: RevenueQueryDTO = {
        startDate: req.query.startDate as any,
        endDate: req.query.endDate as any,
        groupBy: (req.query.groupBy as any) || "DAY",
      };

      const revenue = await this.useCase.getRevenue(partnerId, query);
      successResponse(res, revenue, "Revenue retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async createWithdrawal(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const data: CreateWithdrawalDTO = req.body;
      const result = await this.useCase.createWithdrawal(partnerId, data);
      successResponse(res, result, "Withdrawal created successfully", 201);
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async getWithdrawals(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const query: ListWithdrawalsQueryDTO = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        status: req.query.status as any,
        startDate: req.query.startDate as any,
        endDate: req.query.endDate as any,
      };

      const result = await this.useCase.getWithdrawals(partnerId, query);
      successResponse(res, result, "Withdrawals retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async getWithdrawalDetail(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { withdrawalId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const withdrawal = await this.useCase.getWithdrawalDetail(partnerId, String(withdrawalId));
      successResponse(res, withdrawal, "Withdrawal retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 404, error.message, error.code);
    }
  }
}