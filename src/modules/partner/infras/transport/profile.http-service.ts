import { Request, Response } from "express";
import { successResponse, errorResponse } from "@/share/transport/http-server";
import { IPartnerProfileUseCase } from "@/modules/partner/interface/profile.interface";
import { UpdatePartnerDTO } from "@/modules/partner/model/dto";

export class PartnerProfileHttpService {
  constructor(private useCase: IPartnerProfileUseCase) {}

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const profile = await this.useCase.getProfile(partnerId);
      successResponse(res, profile, "Profile retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const data: UpdatePartnerDTO = req.body;
      const updated = await this.useCase.updateProfile(partnerId, data);
      successResponse(res, updated, "Profile updated successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const status = await this.useCase.getStatus(partnerId);
      successResponse(res, status, "Status retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }
}
