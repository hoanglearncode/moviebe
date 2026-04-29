import { NextFunction, Request, Response } from "express";
import { createPartnerRepository } from "../infras/repository/profile.repo";
import { errorResponse } from "../../../share";

export function resolvePartnerIdMiddleware(partnerRepo: ReturnType<typeof createPartnerRepository>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        errorResponse(res, 401, "Unauthorized");
        return;
      }

      const partner = await partnerRepo.findByUserId(userId);
      if (!partner) {
        errorResponse(res, 404, "Partner profile not found for this user");
        return;
      }

      (req as any).partnerId = partner.id;
      next();
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  };
}
