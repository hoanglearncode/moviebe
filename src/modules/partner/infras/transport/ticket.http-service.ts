import { Request, Response } from "express";
import { successResponse, errorResponse } from "@/share/transport/http-server";
import { ITicketCheckInUseCase } from "@/modules/partner/interface";
import { CheckInDTO, ListTicketsQueryDTO } from "@/modules/partner/model/dto";

export class TicketCheckInHttpService {
  constructor(private useCase: ITicketCheckInUseCase) {}

  async getTickets(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const query: ListTicketsQueryDTO = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        showtimeId: req.query.showtimeId as string,
        status: req.query.status as any,
        startDate: req.query.startDate as any,
        endDate: req.query.endDate as any,
      };

      const result = await this.useCase.getTickets(partnerId, query);
      successResponse(res, result, "Tickets retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async getTicketDetail(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { ticketId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const ticket = await this.useCase.getTicketDetail(partnerId, String(ticketId));
      successResponse(res, ticket, "Ticket retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 404, error.message, error.code);
    }
  }

  async checkIn(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const data: CheckInDTO = req.body;
      const result = await this.useCase.checkInTicket(partnerId, data);
      successResponse(res, result, "Check-in successful");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async getCheckInHistory(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { showtimeId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const history = await this.useCase.getCheckInHistory(partnerId, String(showtimeId));
      successResponse(res, history, "Check-in history retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }
}
