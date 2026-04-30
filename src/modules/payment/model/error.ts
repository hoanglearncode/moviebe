import { AppError } from "@/share/transport/http-server";
import { ErrorCode } from "@/share/model/error-code";

export class PaymentOrderNotFoundError extends AppError {
  constructor() {
    super("Order not found", ErrorCode.NOT_FOUND, 404);
    this.name = "PaymentOrderNotFoundError";
  }
}

export class OrderNotPendingError extends AppError {
  constructor(status: string) {
    super(`Order cannot be paid (status: ${status})`, ErrorCode.VALIDATION, 400);
    this.name = "OrderNotPendingError";
  }
}

export class PaymentAccessDeniedError extends AppError {
  constructor() {
    super("Access denied to this payment", ErrorCode.UNAUTHORIZED, 403);
    this.name = "PaymentAccessDeniedError";
  }
}
