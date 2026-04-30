import { Request, Response } from "express";
import { IUserTicketUseCase } from "@/modules/ticket/interface";
import { ListTicketsDTOSchema } from "@/modules/ticket/model/dto";
import { successResponse, errorResponse } from "@/share/transport/http-server";

function getParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export class UserTicketHttpService {
  constructor(private readonly useCase: IUserTicketUseCase) {}

  async getMyTickets(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const query = ListTicketsDTOSchema.parse(req.query);
      const result = await this.useCase.getMyTickets(userId, query);
      successResponse(res, result, "Tickets retrieved");
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async getTicketDetail(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const ticketId = getParam(req.params["ticketId"]);
      if (!ticketId) {
        errorResponse(res, 400, "Ticket ID is required");
        return;
      }
      const ticket = await this.useCase.getTicketDetail(userId, ticketId);
      successResponse(res, ticket, "Ticket retrieved");
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    if (error && typeof error === "object" && "status" in error && "message" in error) {
      const e = error as any;
      res.status(e.status).json({ code: e.code, message: e.message });
      return;
    }
    if (error instanceof Error) {
      if (error.name === "ZodError") {
        res.status(400).json({ message: "Validation error", details: (error as any).errors });
        return;
      }
      res.status(500).json({ message: error.message || "Internal server error" });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
