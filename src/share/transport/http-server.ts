import { Request, Response } from "express";
import { IUseCase } from "../interface";
import { PagingDTOSchema } from "../model/paging";
import { ErrorCode } from "../model/error-code";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly status: number,
    public readonly details?: any,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any, code: ErrorCode = ErrorCode.VALIDATION) {
    super(message, code, 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, code: ErrorCode = ErrorCode.NOT_FOUND) {
    super(`${resource} not found`, code, 404);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", code: ErrorCode = ErrorCode.UNAUTHORIZED) {
    super(message, code, 401);
    this.name = "UnauthorizedError";
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string = "Conflict",
    code: ErrorCode = ErrorCode.CONCURRENT_TASK_LOCKED,
    details?: any,
  ) {
    super(message, code, 409, details);
    this.name = "ConflictError";
  }
}

export abstract class BaseHttpService<Entity, CreateDTO, UpdateDTO, Cond> {
  constructor(readonly useCase: IUseCase<CreateDTO, UpdateDTO, Entity, Cond>) {}

  protected getRequiredId(value: string | string[] | undefined): string {
    const id = Array.isArray(value) ? value[0] : value;
    if (!id) {
      throw new ValidationError("ID is required");
    }

    return id;
  }

  protected async handleRequest<T>(
    res: Response,
    operation: () => Promise<T>,
    successStatus: number = 200,
  ): Promise<void> {
    try {
      const result = await operation();
      res.status(successStatus).json({ data: result });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof AppError) {
      res.status(error.status).json({
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return;
    }

    console.error("Unhandled error:", error);
    res.status(500).json({
      code: ErrorCode.INTERNAL,
      message: "Internal server error",
    });
  }

  async createAPI(req: Request<any, any, CreateDTO>, res: Response) {
    await this.handleRequest(res, () => this.useCase.create(req.body), 201);
  }

  async getDetailAPI(req: Request, res: Response) {
    await this.handleRequest(res, () => {
      return this.useCase.getDetail(this.getRequiredId(req.params.id));
    });
  }

  async listAPI(req: Request, res: Response) {
    await this.handleRequest(res, async () => {
      const pagingResult = PagingDTOSchema.safeParse(req.query);
      if (!pagingResult.success) {
        throw new ValidationError("Invalid paging parameters", pagingResult.error.issues);
      }

      const cond = req.query as Cond;
      return this.useCase.list(cond, pagingResult.data);
    });
  }

  async updateAPI(req: Request<any, any, UpdateDTO>, res: Response) {
    await this.handleRequest(res, () => {
      return this.useCase.update(this.getRequiredId(req.params.id), req.body);
    });
  }

  async deleteAPI(req: Request, res: Response) {
    await this.handleRequest(res, () => {
      return this.useCase.delete(this.getRequiredId(req.params.id));
    });
  }
}

/**
 * ==========================================
 * UTILITY RESPONSE FUNCTIONS
 * ==========================================
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Send success response
 */
export function successResponse<T>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: number = 200,
): void {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  } as ApiResponse<T>);
}

/**
 * Send error response
 */
export function errorResponse(
  res: Response,
  statusCode: number = 500,
  message: string = "Internal server error",
  code: string = ErrorCode.INTERNAL.toString(),
  details?: any,
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  } as ApiResponse<null>);
}
