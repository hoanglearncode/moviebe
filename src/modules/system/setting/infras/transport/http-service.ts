import { Request, Response } from "express";
import { ZodType } from "zod";
import { IUserSetting } from "../../interface";
import {
  UnauthorizedError,
  errorResponse,
  successResponse,
} from "../../../../../share/transport/http-server";
import { UserSettingUpdate } from "../../model/model";

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
  };
};

export class AdminUserHttpService {
  private readonly settingUseCase: IUserSetting;
  private readonly schema: ZodType<UserSettingUpdate>;

  constructor(useCase: IUserSetting, schema: ZodType<UserSettingUpdate>) {
    this.settingUseCase = useCase;
    this.schema = schema;
  }

  private getUserId(req: Request): string {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) throw new UnauthorizedError();
    return userId;
  }

  async list(req: Request, res: Response) {
    try {
      const data = await this.settingUseCase.get(this.getUserId(req));
      successResponse(res, data);
    } catch (error: any) {
      errorResponse(res, error.status, error.message, error.code, error.details);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const parsed = this.schema.parse(req.body);

      const result = await this.settingUseCase.update(this.getUserId(req), parsed);

      successResponse(res, result);
    } catch (error: any) {
      errorResponse(res, error.status, error.message, error.code, error.details);
    }
  }

  async reset(req: Request, res: Response) {
    try {
      const result = await this.settingUseCase.reset(this.getUserId(req));

      successResponse(res, result);
    } catch (error: any) {
      errorResponse(res, error.status, error.message, error.code, error.details);
    }
  }
}
