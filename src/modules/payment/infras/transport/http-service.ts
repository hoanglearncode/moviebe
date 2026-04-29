import { Request, Response } from "express";
import { IPaymentUseCase } from "../../interface";
import { CreatePaymentDTOSchema, ConfirmMockPaymentDTOSchema } from "../../model/dto";
import { successResponse, errorResponse } from "../../../../share/transport/http-server";

function getParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export class PaymentHttpService {
  constructor(private readonly useCase: IPaymentUseCase) {}

  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const body = CreatePaymentDTOSchema.parse(req.body);
      const result = await this.useCase.createPayment(userId, body.orderId, body.paymentMethod);
      successResponse(res, result, "Payment initiated", 201);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const orderId = getParam(req.params["orderId"]);
      if (!orderId) {
        errorResponse(res, 400, "Order ID is required");
        return;
      }
      const order = await this.useCase.getPaymentStatus(userId, orderId);
      successResponse(res, order, "Payment status retrieved");
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async confirmMockPayment(req: Request, res: Response): Promise<void> {
    try {
      const body = ConfirmMockPaymentDTOSchema.parse(req.body);
      const result = await this.useCase.confirmMockPayment(
        body.orderId,
        body.gatewayRef,
        body.status,
      );
      successResponse(res, result, "Payment confirmed");
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
      console.error("[PaymentHttpService]", error);
      res.status(500).json({ message: error.message || "Internal server error" });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
