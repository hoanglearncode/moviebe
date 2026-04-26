"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCinemaRouter = buildCinemaRouter;
const express_1 = require("express");
const http_server_1 = require("../../share/transport/http-server");
const usecase_1 = require("./usecase");
function buildCinemaRouter(prisma) {
    const router = (0, express_1.Router)();
    const useCase = new usecase_1.CinemaUseCase(prisma);
    router.get("/", async (req, res) => {
        try {
            const data = await useCase.list({
                city: req.query.city,
                search: req.query.search,
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
            });
            (0, http_server_1.successResponse)(res, data);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    router.get("/cities", async (req, res) => {
        try {
            const data = await useCase.getCities();
            (0, http_server_1.successResponse)(res, data);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    router.get("/:id", async (req, res) => {
        try {
            const data = await useCase.getDetail(req.params.id);
            if (!data)
                return (0, http_server_1.errorResponse)(res, 404, "Cinema not found");
            (0, http_server_1.successResponse)(res, data);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    return router;
}
