import { AppError, ValidationError } from "../../../share/transport/http-server";
import { ErrorCode } from "../../../share/model/error-code";

export class ShowtimeNotFoundError extends AppError {
  constructor() {
    super("Showtime not found", ErrorCode.NOT_FOUND, 404);
    this.name = "ShowtimeNotFoundError";
  }
}

export class ShowtimeNotAvailableError extends AppError {
  constructor(message = "Showtime is not available for booking") {
    super(message, ErrorCode.VALIDATION, 400);
    this.name = "ShowtimeNotAvailableError";
  }
}

export class SeatsNotAvailableError extends AppError {
  constructor(seatNumbers: string[]) {
    super(
      `Seats ${seatNumbers.join(", ")} are not available`,
      ErrorCode.CONCURRENT_TASK_LOCKED,
      409,
    );
    this.name = "SeatsNotAvailableError";
  }
}

export class OrderNotFoundError extends AppError {
  constructor() {
    super("Order not found", ErrorCode.NOT_FOUND, 404);
    this.name = "OrderNotFoundError";
  }
}

export class OrderAccessDeniedError extends AppError {
  constructor() {
    super("Access denied to this order", ErrorCode.UNAUTHORIZED, 403);
    this.name = "OrderAccessDeniedError";
  }
}

export class OrderAlreadyCompletedError extends AppError {
  constructor() {
    super("Cannot cancel a completed order", ErrorCode.VALIDATION, 400);
    this.name = "OrderAlreadyCompletedError";
  }
}

export { ValidationError };
