import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../../share/transport/http-server";
import {
  IShowtimeManagementUseCase,
} from "../../interface";
import {
  CreateShowtimeDTO,
  UpdateShowtimeDTO,
  ListShowtimesQueryDTO,
} from "../../model/dto";

export class ShowtimeManagementHttpService {
  constructor(private useCase: IShowtimeManagementUseCase) {}

  async createShowtime(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const data: CreateShowtimeDTO = req.body;
      const result = await this.useCase.createShowtime(partnerId, data);
      successResponse(res, result, "Showtime created successfully", 201);
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async getShowtimes(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const query: ListShowtimesQueryDTO = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        movieId: req.query.movieId as string,
        startDate: req.query.startDate as any,
        endDate: req.query.endDate as any,
        status: req.query.status as any,
        sortBy: (req.query.sortBy as "startTime" | "createdAt") || "startTime",
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "asc",
      };

      const result = await this.useCase.getShowtimes(partnerId, query);
      successResponse(res, result, "Showtimes retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async getShowtimeDetail(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { showtimeId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const showtime = await this.useCase.getShowtimeDetail(partnerId, String(showtimeId));
      successResponse(res, showtime, "Showtime retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 404, error.message, error.code);
    }
  }

  async updateShowtime(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { showtimeId } = req.params;
      const data: UpdateShowtimeDTO = req.body;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const updated = await this.useCase.updateShowtime(partnerId, String(showtimeId), data);
      successResponse(res, updated, "Showtime updated successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async cancelShowtime(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { showtimeId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const result = await this.useCase.cancelShowtime(partnerId, String(showtimeId));
      successResponse(res, result, "Showtime cancelled successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }
}
