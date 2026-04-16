import { PrismaClient, Role } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { Request, Response } from "express";
import { z } from "zod";
import { logger } from "../../../system/log/logger";
import { successResponse, errorResponse } from "../../../../share/transport/http-server";
import {
  IPartnerRequestRepository,
  PartnerRequestUpdateInput,
} from "../repository/partner-request-repo";
import { IPartnerRepository } from "../../interface";

export const SubmitPartnerRequestSchema = z.object({
  cinemaName: z.string().trim().min(1, "Cinema name is required").max(255),
  address: z.string().trim().min(5, "Address is required"),
  city: z.string().trim().min(1, "City is required"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{9,}$/, "Invalid phone number"),
  email: z.string().trim().email("Invalid email"),
  logo: z.string().trim().optional(),
  taxCode: z.string().trim().min(1, "Tax code is required"),
  businessLicense: z.string().trim().optional(),
  bankAccountName: z.string().trim().min(1, "Bank account name is required"),
  bankAccountNumber: z.string().trim().min(10, "Invalid bank account number"),
  bankName: z.string().trim().min(1, "Bank name is required"),
});

export class PartnerRequestHttpService {
  constructor(
    private readonly partnerRequestRepo: IPartnerRequestRepository,
    private readonly partnerRepo: IPartnerRepository,
    private readonly prisma: PrismaClient,
  ) {}

  async submit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) return errorResponse(res, 401, "Unauthorized");

      const existingPartner = await this.partnerRepo.findByUserId(userId);
      if (existingPartner) {
        return errorResponse(res, 409, "You are already a partner");
      }

      const alreadySubmitted = await this.partnerRequestRepo.existsByUserId(userId);
      if (alreadySubmitted) {
        return errorResponse(res, 409, "A partner request is already pending or approved");
      }

      const parsed = SubmitPartnerRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return errorResponse(
          res,
          400,
          "Invalid partner request data",
          "VALIDATION_ERROR",
          parsed.error.flatten(),
        );
      }

      const userRecord = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      const request = await this.partnerRequestRepo.create({
        userId,
        cinemaName: parsed.data.cinemaName,
        address: parsed.data.address,
        city: parsed.data.city,
        phone: parsed.data.phone,
        email: parsed.data.email || userRecord?.email || "",
        logo: parsed.data.logo ?? null,
        taxCode: parsed.data.taxCode,
        businessLicense: parsed.data.businessLicense ?? null,
        bankAccountName: parsed.data.bankAccountName,
        bankAccountNumber: parsed.data.bankAccountNumber,
        bankName: parsed.data.bankName,
      });

      successResponse(res, request, "Partner request submitted successfully", 201);
    } catch (error: any) {
      logger.error("[PartnerRequest] submit error", { error: error.message });
      errorResponse(res, 500, error.message);
    }
  }

  async editSubmit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) return errorResponse(res, 401, "Unauthorized");

      const existingPartner = await this.partnerRepo.findByUserId(userId);
      if (existingPartner) {
        return errorResponse(res, 409, "You are already a partner");
      }

      const existingRequest = await this.partnerRequestRepo.findByUserId(userId);
      if (!existingRequest) {
        return errorResponse(res, 404, "Partner request not found");
      }

      if (existingRequest.status !== "PENDING") {
        return errorResponse(
          res,
          409,
          `Only pending requests can be updated. Current status: ${existingRequest.status}`,
        );
      }

      const parsed = SubmitPartnerRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return errorResponse(
          res,
          400,
          "Invalid partner request data",
          "VALIDATION_ERROR",
          parsed.error.flatten(),
        );
      }

      const userRecord = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      const updateData: PartnerRequestUpdateInput = {
        cinemaName: parsed.data.cinemaName,
        address: parsed.data.address,
        city: parsed.data.city,
        phone: parsed.data.phone,
        email: parsed.data.email || userRecord?.email || "",
        logo: parsed.data.logo ?? null,
        taxCode: parsed.data.taxCode,
        businessLicense: parsed.data.businessLicense ?? null,
        bankAccountName: parsed.data.bankAccountName,
        bankAccountNumber: parsed.data.bankAccountNumber,
        bankName: parsed.data.bankName,
      };

      const request = await this.partnerRequestRepo.update(existingRequest.id, updateData);
      successResponse(res, request, "Partner request updated successfully");
    } catch (error: any) {
      logger.error("[PartnerRequest] edit submit error", { error: error.message });
      errorResponse(res, 500, error.message);
    }
  }

  async getMyRequest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) return errorResponse(res, 401, "Unauthorized");

      const partner = await this.partnerRepo.findByUserId(userId);
      if (partner) {
        return successResponse(res, { type: "partner", partner }, "Already a partner");
      }

      const request = await this.partnerRequestRepo.findByUserId(userId);
      if (!request) {
        return successResponse(res, { type: "none", request: null }, "No partner request found");
      }

      successResponse(res, { type: "request", request }, "Partner request status");
    } catch (error: any) {
      errorResponse(res, 500, error.message);
    }
  }

  async adminListRequests(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(String(req.query.page || "1"), 10);
      const limit = parseInt(String(req.query.limit || "20"), 10);
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await this.partnerRequestRepo.findAll({ page, limit, status, search });
      successResponse(res, { ...result, page, limit }, "Partner request list");
    } catch (error: any) {
      errorResponse(res, 500, error.message);
    }
  }

  async adminGetRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = await this.partnerRequestRepo.findById(String(id));
      if (!request) return errorResponse(res, 404, "Partner request not found");
      successResponse(res, request, "Partner request detail");
    } catch (error: any) {
      errorResponse(res, 500, error.message);
    }
  }

  async adminApprove(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) return errorResponse(res, 401, "Unauthorized");

      const { id } = req.params;
      const request = await this.partnerRequestRepo.findById(String(id));
      if (!request) return errorResponse(res, 404, "Partner request not found");
      if (request.status !== "PENDING") {
        return errorResponse(res, 409, `Request already processed with status ${request.status}`);
      }

      const partnerId = uuidv7();
      const now = new Date();

      await this.prisma.$transaction(async (tx) => {
        await tx.partner.create({
          data: {
            id: partnerId,
            userId: request.userId,
            cinemaName: request.cinemaName,
            address: request.address,
            city: request.city,
            country: "Vietnam",
            phone: request.phone,
            email: request.email,
            logo: request.logo,
            taxCode: request.taxCode,
            businessLicense: request.businessLicense,
            bankAccountName: request.bankAccountName,
            bankAccountNumber: request.bankAccountNumber,
            bankName: request.bankName,
            bankCode: "VN",
            status: "APPROVED",
            approvedAt: now,
            commissionRate: 0.1,
          },
        });

        await tx.partnerWallet.create({
          data: {
            partnerId,
            balance: 0,
            totalEarned: 0,
            totalWithdrawn: 0,
            totalRefunded: 0,
          },
        });

        await tx.user.update({
          where: { id: request.userId },
          data: { role: Role.PARTNER },
        });

        await (tx.partnerRequest as any).update({
          where: { id },
          data: { status: "APPROVED", reviewedBy: adminId, reviewedAt: now },
        });
      });

      logger.info("[PartnerRequest] approved", {
        requestId: id,
        userId: request.userId,
        partnerId,
      });
      successResponse(res, { requestId: id, partnerId }, "Partner request approved");
    } catch (error: any) {
      logger.error("[PartnerRequest] approve error", { error: error.message });
      errorResponse(res, 500, error.message);
    }
  }

  async adminReject(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) return errorResponse(res, 401, "Unauthorized");

      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || String(reason).trim().length === 0) {
        return errorResponse(res, 400, "Rejection reason is required");
      }

      const request = await this.partnerRequestRepo.findById(String(id));
      if (!request) return errorResponse(res, 404, "Partner request not found");
      if (request.status !== "PENDING") {
        return errorResponse(res, 409, `Request already processed with status ${request.status}`);
      }

      await this.partnerRequestRepo.updateStatus(
        String(id),
        "REJECTED",
        adminId,
        String(reason).trim(),
      );

      logger.info("[PartnerRequest] rejected", { requestId: id, userId: request.userId });
      successResponse(res, { requestId: id }, "Partner request rejected");
    } catch (error: any) {
      logger.error("[PartnerRequest] reject error", { error: error.message });
      errorResponse(res, 500, error.message);
    }
  }
}
