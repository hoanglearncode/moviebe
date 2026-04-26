"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaUserSettingsRepository = void 0;
const dto_1 = require("./dto");
class PrismaUserSettingsRepository {
    constructor(prisma) {
        this.model = (0, dto_1.getUserSettingModel)(prisma);
    }
}
exports.PrismaUserSettingsRepository = PrismaUserSettingsRepository;
