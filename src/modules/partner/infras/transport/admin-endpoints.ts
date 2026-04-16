import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { authMiddleware, requireRole } from "../../../../share/middleware/auth";
import { createPartnerRequestRepository } from "../repository/partner-request-repo";
import { createPartnerRepository } from "../repository/repo";
import { PartnerRequestHttpService } from "./partner-request-http";

export const buildPartnerRequestAdminRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const service = new PartnerRequestHttpService(
    createPartnerRequestRepository(prisma),
    createPartnerRepository(prisma),
    prisma,
  );
  const adminGuard = [authMiddleware, requireRole("ADMIN")];

  router.get("/partner-requests", ...adminGuard, (req, res) => service.adminListRequests(req, res));
  router.get("/partner-requests/:id", ...adminGuard, (req, res) =>
    service.adminGetRequest(req, res),
  );
  router.put("/partner-requests/:id/approve", ...adminGuard, (req, res) =>
    service.adminApprove(req, res),
  );
  router.put("/partner-requests/:id/reject", ...adminGuard, (req, res) =>
    service.adminReject(req, res),
  );

  return router;
};

export default buildPartnerRequestAdminRouter;
