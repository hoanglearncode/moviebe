"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSettingHexagon = exports.createSettingUseCase = void 0;
const express_1 = require("express");
const http_service_1 = require("./infras/transport/http-service");
const user_setting_usecase_1 = require("./usecase/user-setting.usecase");
const auth_1 = require("../../../share/middleware/auth");
const prisma_1 = require("../../../share/component/prisma");
const model_1 = require("./model/model");
const createSettingUseCase = (prismaClient = prisma_1.prisma) => {
    return new user_setting_usecase_1.UserSettingUseCase(prismaClient);
};
exports.createSettingUseCase = createSettingUseCase;
const setupSettingHexagon = (prismaClient = prisma_1.prisma, settingUseCase) => {
    const useCase = settingUseCase || (0, exports.createSettingUseCase)(prismaClient);
    const httpService = new http_service_1.AdminUserHttpService(useCase, model_1.UpdateUserSettingSchema);
    const router = (0, express_1.Router)();
    router.get("/settings", ...(0, auth_1.protect)(), httpService.list.bind(httpService));
    router.patch("/settings", ...(0, auth_1.protect)(), httpService.update.bind(httpService));
    router.post("/settings/reset", ...(0, auth_1.protect)(), httpService.reset.bind(httpService));
    return { router, useCase };
};
exports.setupSettingHexagon = setupSettingHexagon;
