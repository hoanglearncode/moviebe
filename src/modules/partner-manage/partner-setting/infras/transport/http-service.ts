import { Request, Response } from "express";
import { IPartnerSettingUseCase } from "@/modules/partner-manage/partner-setting/interface";
import { successResponse, errorResponse, UnauthorizedError } from "@/share/transport/http-server";

type PartnerRequest = Request & { partnerId?: string };

export class PartnerSettingHttpService {
  constructor(private readonly usecase: IPartnerSettingUseCase) {}

  private getPartnerId(req: PartnerRequest): string {
    if (!req.partnerId) throw new UnauthorizedError("Partner context not resolved");
    return req.partnerId;
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.usecase.get(this.getPartnerId(req as PartnerRequest));
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, err.status ?? 500, err.message, err.code, err.details);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      await this.usecase.update(this.getPartnerId(req as PartnerRequest), req.body);
      successResponse(res, { success: true });
    } catch (err: any) {
      errorResponse(res, err.status ?? 400, err.message, err.code, err.details);
    }
  }

  async reset(req: Request, res: Response): Promise<void> {
    try {
      await this.usecase.reset(this.getPartnerId(req as PartnerRequest));
      successResponse(res, { success: true });
    } catch (err: any) {
      errorResponse(res, err.status ?? 500, err.message, err.code, err.details);
    }
  }
}
