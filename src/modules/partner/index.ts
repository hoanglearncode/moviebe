import { PrismaClient } from "@prisma/client";
import { Router } from "express";

import buildPartnerRouter from "./infras/transport/partner-endpoints";
import { buildPartnerRequestAdminRouter } from "./infras/transport/admin-endpoints";
import { buildPartnerRequestUserRouter } from "./infras/transport/user-endpoints";

/**
 * Partner module composition root.
 *
 * Main partner portal:
 *   app.use("/v1/partner", setupPartnerHexagon(prisma))
 *
 * Partner registration flow:
 *   app.use("/v1/user", setupPartnerRequestRoutes(prisma).userRouter)
 *   app.use("/v1/admin", setupPartnerRequestRoutes(prisma).adminRouter)
 */
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
