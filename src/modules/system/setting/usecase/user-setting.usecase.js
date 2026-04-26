"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSettingUseCase = void 0;
const model_1 = require("../model/model");
const seed_setting_1 = require("../../../../share/common/seed-setting");
const dto_1 = require("../infras/repository/dto");
const http_server_1 = require("../../../../share/transport/http-server");
class UserSettingUseCase {
    constructor(prisma) {
        this.model = (0, dto_1.getUserSettingModel)(prisma);
    }
    /**
     * Convert array toggle → object update
     */
    mapArrayToObject(data) {
        const result = {};
        for (const item of data) {
            if (!item.id || typeof item.enabled !== "boolean") {
                throw new http_server_1.ValidationError("Invalid setting item", item);
            }
            result[item.id] = item.enabled;
        }
        return result;
    }
    /**
     * Get user settings
     * Auto create default nếu chưa có
     */
    async get(userId) {
        let raw = await this.model.findUnique({ where: { userId } });
        if (!raw) {
            raw = await this.model.create({
                data: {
                    userId,
                    ...seed_setting_1.defaultSettings,
                },
            });
        }
        return raw;
    }
    /**
     * Update settings (PATCH style)
     */
    async update(userId, data) {
        if (!data) {
            throw new http_server_1.ValidationError("Update data is required");
        }
        // nếu FE gửi array → convert
        const mapped = Array.isArray(data) ? this.mapArrayToObject(data) : data;
        const updates = model_1.UpdateUserSettingSchema.parse(mapped);
        await this.model.upsert({
            where: { userId },
            update: updates,
            create: {
                userId,
                ...seed_setting_1.defaultSettings,
                ...updates,
            },
        });
        return true;
    }
    /**
     * Reset về default
     */
    async reset(userId) {
        await this.model.upsert({
            where: { userId },
            update: {
                ...seed_setting_1.defaultSettings,
            },
            create: {
                userId,
                ...seed_setting_1.defaultSettings,
            },
        });
        return true;
    }
    /**
     * Tạo default (nếu chưa có)
     */
    async default(userId) {
        const existed = await this.model.findUnique({
            where: { userId },
        });
        if (existed) {
            return true;
        }
        await this.model.create({
            data: {
                userId,
                ...seed_setting_1.defaultSettings,
            },
        });
        return true;
    }
}
exports.UserSettingUseCase = UserSettingUseCase;
