import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../../share/transport/http-server";
import { IPartnerProfileUseCase } from "../../interface/profile.interface";
import { UpdatePartnerPayloadDTO } from "../../model/dto";

export class PartnerProfileHttpService {
  constructor(private readonly useCase: IPartnerProfileUseCase) {}

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const profile = await this.useCase.getProfile((req as any).partnerId);
      successResponse(res, profile);
    } catch (err: any) {
      errorResponse(res, err.statusCode || 500, err.message, err.code);
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const parsed = UpdatePartnerPayloadDTO.parse(req.body);
      const updated = await this.useCase.updateProfile((req as any).partnerId, parsed);
      successResponse(res, updated);
    } catch (err: any) {
      errorResponse(res, err.statusCode || 400, err.message, err.code);
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.useCase.getStatus((req as any).partnerId);
      successResponse(res, status);
    } catch (err: any) {
      errorResponse(res, err.statusCode || 500, err.message, err.code);
    }
  }
}
