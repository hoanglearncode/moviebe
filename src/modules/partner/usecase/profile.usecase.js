"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerProfileUseCase = void 0;
class PartnerProfileUseCase {
    constructor(partnerRepo) {
        this.partnerRepo = partnerRepo;
    }
    async getProfile(partnerId) {
        const partner = await this.partnerRepo.findById(partnerId);
        if (!partner)
            throw new Error("Partner not found");
        return partner;
    }
    async updateProfile(partnerId, data) {
        const partner = await this.partnerRepo.findById(partnerId);
        if (!partner)
            throw new Error("Partner not found");
        await this.partnerRepo.update(partnerId, { ...data, updatedAt: new Date() });
        const updated = await this.partnerRepo.findById(partnerId);
        if (!updated)
            throw new Error("Partner not found after update");
        return updated;
    }
    async getStatus(partnerId) {
        const partner = await this.partnerRepo.findById(partnerId);
        if (!partner)
            throw new Error("Partner not found");
        return { status: partner.status, approvedAt: partner.approvedAt ?? undefined };
    }
    async updateCommissionRate(partnerId, rate) {
        const partner = await this.partnerRepo.findById(partnerId);
        if (!partner)
            throw new Error("Partner not found");
        if (rate < 0 || rate > 1)
            throw new Error("Commission rate must be between 0 and 1");
        await this.partnerRepo.update(partnerId, { commissionRate: rate, updatedAt: new Date() });
        const updated = await this.partnerRepo.findById(partnerId);
        if (!updated)
            throw new Error("Partner not found after update");
        return updated;
    }
}
exports.PartnerProfileUseCase = PartnerProfileUseCase;
