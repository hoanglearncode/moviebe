import { Request, Response } from "express";
import { IUseCase } from "../interface";
import { PagingDTOSchema } from "../model/paging";

export class ValidationError extends Error {
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
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
    successStatus: number = 200
  ): Promise<void> {
    try {
      const result = await operation();
      res.status(successStatus).json({ data: result });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof ValidationError) {
      res.status(400).json({
        message: error.message,
        details: error.details
      });
      return;
    }

    if (error instanceof NotFoundError) {
      res.status(404).json({
        message: error.message
      });
      return;
    }

    if (error instanceof UnauthorizedError) {
      res.status(401).json({
        message: error.message
      });
      return;
    }

    console.error("Unhandled error:", error);
    res.status(500).json({
      message: "Internal server error"
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
