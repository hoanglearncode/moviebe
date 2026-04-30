import { AppError } from "@/share/transport/http-server";
import { ErrorCode } from "@/share/model/error-code";

export class TicketNotFoundError extends AppError {
  constructor() {
    super("Ticket not found", ErrorCode.NOT_FOUND, 404);
    this.name = "TicketNotFoundError";
  }
}

export class TicketAccessDeniedError extends AppError {
  constructor() {
    super("Access denied to this ticket", ErrorCode.UNAUTHORIZED, 403);
    this.name = "TicketAccessDeniedError";
  }
}
