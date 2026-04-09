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
const social_auth_1 = require("./shared/social-auth");
const realtime_1 = require("./shared/realtime");
const prisma_1 = require("../../share/component/prisma");
const buildRouter = (useCase) => {
    const httpService = new http_service_1.AuthHttpService(useCase);
    const router = (0, express_1.Router)();
    router.post("/auth/register", httpService.register.bind(httpService));
    router.post("/auth/login", httpService.login.bind(httpService));
    router.post("/auth/google/callback", httpService.loginGoogle.bind(httpService));
    router.post("/auth/google/callback/token", httpService.loginGoogleTokenCallback.bind(httpService));
    router.post("/auth/facebook/callback", httpService.loginFacebook.bind(httpService));
    router.post("/auth/refresh-token", httpService.refreshToken.bind(httpService));
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
    const socialAuthService = new social_auth_1.SocialAuthService();
    const realtimeService = new realtime_1.AuthRealtimeService();
    const dependencies = {
        userRepository,
        passwordHasher,
        tokenService,
        notificationService,
        socialAuthService,
        realtimeService,
    };
    const useCase = new usecase_1.AuthUseCase(dependencies);
    return buildRouter(useCase);
};
exports.setupAuthHexagon = setupAuthHexagon;
const setupAuthHexagonWithUseCase = (useCase) => buildRouter(useCase);
exports.setupAuthHexagonWithUseCase = setupAuthHexagonWithUseCase;
