"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCategoryHexagon = void 0;
const express_1 = require("express");
const http_service_1 = require("./infras/transport/http-service");
const usecase_1 = require("./usecase");
const setupCategoryHexagon = (repository) => {
    const useCase = new usecase_1.CategoryUseCase(repository);
    const httpService = new http_service_1.CategoryHttpService(useCase);
    const router = (0, express_1.Router)();
    router.post('/categories', httpService.createAPI.bind(httpService));
    router.get('/categories/:id', httpService.getDetailAPI.bind(httpService));
    router.get('/categories', httpService.listAPI.bind(httpService));
    router.patch('/categories/:id', httpService.updateAPI.bind(httpService));
    router.delete('/categories/:id', httpService.deleteAPI.bind(httpService));
    return router;
};
exports.setupCategoryHexagon = setupCategoryHexagon;
