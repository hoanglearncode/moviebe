import { PrismaClient } from "@prisma/client";
import { Router } from "express";

import buildPartnerRouter from "./infras/transport/partner-endpoints";
import { buildPartnerRequestAdminRouter } from "./infras/transport/admin-endpoints";
import { buildPartnerRequestUserRouter } from "./infras/transport/user-endpoints";

export const setupPartnerHexagon = (prisma: PrismaClient): Router => {
  return buildPartnerRouter(prisma);
};

export const setupPartnerRequestRoutes = (
  prisma: PrismaClient,
): { adminRouter: Router; userRouter: Router } => {
  return {
    adminRouter: buildPartnerRequestAdminRouter(prisma),
    userRouter: buildPartnerRequestUserRouter(prisma),
  };
};
