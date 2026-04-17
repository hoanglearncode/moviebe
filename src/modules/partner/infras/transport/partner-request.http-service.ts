import { Request, Response } from "express";
import { logger } from "../../../system/log/logger";
import {
  AppError,
  errorResponse,
  successResponse,
} from "../../../../share/transport/http-server";
import { IPartnerRequestUseCase } from "../../interface/partner-request.interface";
import { RequestCondDTOSchema } from "../../model/dto";

export class PartnerRequestHttpService {
  constructor( private readonly requestUseCase: IPartnerRequestUseCase ) {}

  private handleError(res: Response, error: unknown, fallbackStatus: number = 500): void {
    if (error instanceof AppError) {
      errorResponse(res, error.status, error.message, String(error.code), error.details);
      return;
    }

    const fallbackError = error as {
      status?: number;
      statusCode?: number;
      message?: string;
      code?: string;
      details?: unknown;
    };

    errorResponse(
      res,
      fallbackError.status ?? fallbackError.statusCode ?? fallbackStatus,
      fallbackError.message ?? "Internal server error",
      fallbackError.code ? String(fallbackError.code) : undefined,
      fallbackError.details,
    );
  }

  async submit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const data = req.body;
      const insert = await this.requestUseCase.submit(userId, data);
      successResponse(res, insert, "Partner request submitted successfully", 201);
    } catch (error: any) {
      logger.error("[PartnerRequest] submit error", { error: error.message });
      this.handleError(res, error, 500);
    }
  }

  async editSubmit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const data = req.body;
      const insert = await this.requestUseCase.editSubmit(userId, data);
      successResponse(res, insert, "Partner request updated successfully");
    } catch (error: any) {
      logger.error("[PartnerRequest] edit submit error", { error: error.message });
      this.handleError(res, error, 500);
    }
  }

  async getMyRequest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const insert = await this.requestUseCase.getMyRequest(userId); 
      successResponse(res, insert, "Partner request status");
    } catch (error: any) {
      this.handleError(res, error, 500);
    }
  }

  async adminListRequests(req: Request, res: Response): Promise<void> {
    try {
      const cound = RequestCondDTOSchema.parse(req.query);
      const insert = await this.requestUseCase.adminListRequests(cound);
      successResponse(res, insert, "Partner request list");
    } catch (error: any) {
      this.handleError(res, error, 500);
    }
  }

  async adminGetRequest(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const insert = await this.requestUseCase.adminGetRequest(id);
      successResponse(res, insert, "Partner request detail");
    } catch (error: any) {
      this.handleError(res, error, 500);
    }
  }

async adminApprove(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const insert = await this.requestUseCase.adminApprove(id);
    successResponse(res, insert, "Partner request approved");
  } catch (error: any) {
    logger.error("[PartnerRequest] approve error", { error: error.message });
    this.handleError(res, error, 500);
  }
}

  async adminReject(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const reason = req.body.reason as string;
      const insert = await this.requestUseCase.adminReject(id, reason);
      successResponse(res, insert, "Partner request rejected");
    } catch (error: any) {
      logger.error("[PartnerRequest] reject error", { error: error.message });
      this.handleError(res, error, 500);
    }
  }
}
