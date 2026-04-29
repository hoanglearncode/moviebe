import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../../share/transport/http-server";
import { ISeatManagementUseCase } from "../../interface";
import { UpdateSeatDTO } from "../../model/dto";




export class SeatManagementHttpService {
  constructor(private useCase: ISeatManagementUseCase) {}

  async getSeats(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { showtimeId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const seats = await this.useCase.getSeats(partnerId, String(showtimeId));
      successResponse(res, seats, "Seats retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async updateSeat(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { seatId } = req.params;
      const data: UpdateSeatDTO = req.body;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const updated = await this.useCase.updateSeat(partnerId, String(seatId), data);
      successResponse(res, updated, "Seat updated successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async getSeatMap(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { showtimeId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const seatMap = await this.useCase.getSeatMap(partnerId, String(showtimeId));
      successResponse(res, seatMap, "Seat map retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }
}
