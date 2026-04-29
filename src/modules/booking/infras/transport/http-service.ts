import { Request, Response } from "express";
import { IBookingUseCase } from "../../interface";
import { LockSeatsDTOSchema } from "../../model/dto";
import { successResponse, errorResponse } from "../../../../share/transport/http-server";

function getParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export class BookingHttpService {
  constructor(private readonly useCase: IBookingUseCase) {}

  async lockSeats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const body = LockSeatsDTOSchema.parse(req.body);
      const result = await this.useCase.lockSeats(userId, body);
      successResponse(res, result, "Seats locked successfully", 201);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async getOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const orderId = getParam(req.params["orderId"]);
      if (!orderId) {
        errorResponse(res, 400, "Order ID is required");
        return;
      }
      const order = await this.useCase.getOrder(userId, orderId);
      successResponse(res, order, "Order retrieved");
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const orderId = getParam(req.params["orderId"]);
      if (!orderId) {
        errorResponse(res, 400, "Order ID is required");
        return;
      }
      await this.useCase.cancelOrder(userId, orderId);
      successResponse(res, { orderId }, "Order cancelled");
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    if (error && typeof error === "object" && "status" in error && "message" in error) {
      const e = error as any;
      res.status(e.status).json({ code: e.code, message: e.message, details: e.details });
      return;
    }
    if (error instanceof Error) {
      if (error.name === "ZodError") {
        res.status(400).json({ message: "Validation error", details: (error as any).errors });
        return;
      }
      console.error("[BookingHttpService]", error);
      res.status(500).json({ message: error.message || "Internal server error" });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
