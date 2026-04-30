import { Request, Response } from "express";
import { successResponse, errorResponse } from "@/share/transport/http-server";
import { IPartnerDashboardUseCase } from "@/modules/partner/interface";


export class PartnerDashboardHttpService {
  constructor(private useCase: IPartnerDashboardUseCase) {}

  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const stats = await this.useCase.getDashboardStats(partnerId);
      successResponse(res, stats, "Dashboard stats retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async getTopMovies(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const topMovies = await this.useCase.getTopMovies(partnerId, limit);
      successResponse(res, topMovies, "Top movies retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async getOccupancy(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await this.useCase.getOccupancyStats(partnerId, startDate, endDate);
      successResponse(res, stats, "Occupancy stats retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }
}
