"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestUseCase = void 0;
const crypto_1 = require("crypto");
const share_1 = require("../../../share");
const dto_1 = require("../model/dto");
const model_1 = require("../model/model");
class RequestUseCase {
    constructor(repo, partnerRepo, userRepo, sessionRepo, walletRepo, staffRepo) {
        this.repo = repo;
        this.partnerRepo = partnerRepo;
        this.userRepo = userRepo;
        this.sessionRepo = sessionRepo;
        this.walletRepo = walletRepo;
        this.staffRepo = staffRepo;
    }
    async submit(userId, data) {
        const existing = await this.repo.findByUserId(userId);
        if (existing && existing.status === "PENDING") {
            throw new share_1.ConflictError("You already have a pending request");
        }
        const parsedData = dto_1.SubmitPartnerRequestSchema.safeParse(data);
        if (!parsedData.success) {
            throw new share_1.ValidationError("Invalid partner request data", parsedData.error.issues);
        }
        return this.repo.create({
            ...parsedData.data,
            userId,
        });
    }
    async editSubmit(userId, data) {
        const existing = await this.repo.findByUserId(userId);
        if (!existing) {
            throw new share_1.NotFoundError("Request");
        }
        if (existing.status !== "PENDING") {
            throw new share_1.ConflictError("Cannot edit a non-pending request");
        }
        return this.repo.update(existing.id, data);
    }
    async getMyRequest(userId) {
        const [partner, request] = await Promise.all([
            this.partnerRepo.findByUserId(userId),
            this.repo.findByUserId(userId),
        ]);
        if (partner) {
            return {
                type: "partner",
                request,
                partner,
            };
        }
        if (request) {
            return {
                type: "request",
                request,
                partner: null,
            };
        }
        return {
            type: "none",
            request: null,
            partner: null,
        };
    }
    async getStats() {
        const data = await this.repo.getStatsData();
        return data;
    }
    async adminListRequests(cond) {
        const result = await this.repo.findAll(cond);
        return {
            data: result.items,
            paging: result.paging,
        };
    }
    async adminGetRequest(id) {
        const data = await this.repo.findById(id);
        if (!data) {
            throw new share_1.NotFoundError("Request");
        }
        return data;
    }
    async adminApprove(id) {
        const adminId = "system-admin";
        const request = await this.repo.findById(id);
        if (!request) {
            throw new share_1.NotFoundError("Request");
        }
        if (request.status !== "PENDING") {
            throw new share_1.ConflictError("Only pending requests can be approved");
        }
        const existingPartner = await this.partnerRepo.findByUserId(request.userId);
        if (existingPartner) {
            throw new share_1.ConflictError("User already has an approved partner profile");
        }
        const partnerId = (0, crypto_1.randomUUID)();
        const now = new Date();
        await this.partnerRepo.insert({
            id: partnerId,
            userId: request.userId,
            cinemaName: request.cinemaName,
            address: request.address,
            city: request.city,
            country: "",
            postalCode: null,
            phone: request.phone,
            email: request.email,
            website: null,
            logo: request.logo ?? null,
            taxCode: request.taxCode,
            businessLicense: request.businessLicense ?? null,
            businessLicenseFile: request.businessLicenseFile ?? null,
            representativeName: request.representativeName ?? null,
            representativeIdNumber: request.representativeIdNumber ?? null,
            representativeIdFile: request.representativeIdFile ?? null,
            taxCertificateFile: request.taxCertificateFile ?? null,
            bankAccountName: request.bankAccountName,
            bankAccountNumber: request.bankAccountNumber,
            bankName: request.bankName,
            bankCode: request.bankCode ?? "",
            status: "ACTIVE",
            approvedAt: now,
            rejectionReason: null,
            approvedBy: adminId,
            commissionRate: 0.1,
            createdAt: now,
            updatedAt: now,
        });
        await this.walletRepo.insert({
            id: (0, crypto_1.randomUUID)(),
            partnerId,
            balance: 0,
            totalEarned: 0,
            totalWithdrawn: 0,
            totalRefunded: 0,
            createdAt: now,
            updatedAt: now,
        });
        await this.staffRepo.insert({
            id: (0, crypto_1.randomUUID)(),
            partnerId,
            userId: request.userId,
            role: model_1.StaffRole.OWNER,
            createdAt: now,
        });
        await this.userRepo.update(request.userId, {
            role: "PARTNER",
            status: "ACTIVE",
        });
        await this.sessionRepo.revokeAllSessionsByUserId(request.userId);
        return this.repo.updateStatus(id, "APPROVED", adminId, undefined, partnerId);
    }
    async adminReject(id, reason) {
        const adminId = "system-admin";
        const request = await this.repo.findById(id);
        if (!request) {
            throw new share_1.NotFoundError("Request");
        }
        if (request.status !== "PENDING") {
            throw new share_1.ConflictError("Only pending requests can be rejected");
        }
        if (!reason || reason.trim().length < 3) {
            throw new share_1.ValidationError("Rejection reason is required");
        }
        return this.repo.updateStatus(id, "REJECTED", adminId, reason.trim());
    }
    async adminReset(id) {
        const adminId = "system-admin";
        const request = await this.repo.findById(id);
        if (!request) {
            throw new share_1.NotFoundError("Request");
        }
        if (request.status === "PENDING") {
            throw new share_1.ConflictError("Request is already pending");
        }
        return this.repo.updateStatus(id, "PENDING", adminId);
    }
}
exports.RequestUseCase = RequestUseCase;
