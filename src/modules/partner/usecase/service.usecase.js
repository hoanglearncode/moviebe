"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicePartnerUser = void 0;
const dto_1 = require("../model/dto");
const error_1 = require("../model/error");
class ServicePartnerUser {
    constructor(partnerRepo) {
        this.partnerRepo = partnerRepo;
    }
    async list(partnerId, cond, paging) {
        const parsedCond = dto_1.ServiceCondDTOSchema.parse(cond);
        const data = await this.partnerRepo.list(partnerId, parsedCond, paging);
        return {
            items: data.items,
            total: data.total,
            page: paging.page,
            limit: paging.limit,
            totalPages: Math.ceil(data.total / paging.limit),
        };
    }
    async findByCond(partnerId, cond) {
        const parsedCond = dto_1.ServiceCondDTOSchema.parse(cond);
        const data = await this.partnerRepo.findByCond(partnerId, parsedCond);
        return data;
    }
    async insert(partnerId, data) {
        const { success, data: parsedData, error } = dto_1.CreateServicePayloadDTO.safeParse(data);
        if (!success || error) {
            // TODO: process error
            const issues = error.issues;
            for (const issue of issues) {
                if (issue.path[0] === "name") {
                    throw error_1.ErrCategoryNameTooShort;
                }
            }
            throw error;
        }
        return await this.partnerRepo.insert(partnerId, parsedData);
    }
    async update(partnerId, id, data) {
        const service = await this.partnerRepo.get(partnerId, id);
        if (!service) {
            return null;
        }
        const updateData = dto_1.UpdateServicePayloadDTO.parse(data);
        return await this.partnerRepo.update(partnerId, id, updateData);
    }
    async delete(partnerId, id, isHard) {
        const service = await this.partnerRepo.get(partnerId, id);
        if (!service) {
            return false;
        }
        return await this.partnerRepo.delete(partnerId, id, isHard);
    }
    async findById(partnerId, id) {
        return await this.partnerRepo.get(partnerId, id);
    }
}
exports.ServicePartnerUser = ServicePartnerUser;
