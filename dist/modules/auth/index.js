"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuthHexagonWithUseCase = exports.setupAuthHexagon = void 0;
const express_1 = require("express");
const http_service_1 = require("./infras/transport/http-service");
const repo_1 = require("./infras/repository/repo");
const usecase_1 = require("./usecase");
const hash_1 = require("./shared/hash");
const token_1 = require("./shared/token");
const notification_1 = require("./shared/notification");
const prisma_1 = require("../../share/component/prisma");
const buildRouter = (useCase) => {
    const httpService = new http_service_1.AuthHttpService(useCase);
    const router = (0, express_1.Router)();
    router.post("/auth/register", httpService.register.bind(httpService));
    router.post("/auth/login", httpService.login.bind(httpService));
    router.post("/auth/verify-email", httpService.verifyEmail.bind(httpService));
    router.post("/auth/resend-verification", httpService.resendVerification.bind(httpService));
    router.post("/auth/forgot-password", httpService.forgotPassword.bind(httpService));
    router.post("/auth/change-password", httpService.changePassword.bind(httpService));
    return router;
};
const setupAuthHexagon = (prismaClient = prisma_1.prisma) => {
    const userRepository = (0, repo_1.createAuthUserRepository)(prismaClient);
    const passwordHasher = new hash_1.HashService();
    const tokenService = new token_1.TokenService(prismaClient);
    const notificationService = new notification_1.AuthNotificationService();
    const dependencies = {
        userRepository,
        passwordHasher,
        tokenService,
        notificationService,
    };
    const useCase = new usecase_1.AuthUseCase(dependencies);
    return buildRouter(useCase);
};
exports.setupAuthHexagon = setupAuthHexagon;
const setupAuthHexagonWithUseCase = (useCase) => buildRouter(useCase);
exports.setupAuthHexagonWithUseCase = setupAuthHexagonWithUseCase;
