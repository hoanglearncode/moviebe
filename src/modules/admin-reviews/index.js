"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdminReviewsRouter = buildAdminReviewsRouter;
const express_1 = require("express");
const auth_1 = require("../../share/middleware/auth");
const http_server_1 = require("../../share/transport/http-server");
const adminGuard = [...(0, auth_1.protect)((0, auth_1.requireRole)("ADMIN"))];
function buildAdminReviewsRouter(prisma) {
    const router = (0, express_1.Router)();
    router.get("/", ...adminGuard, async (req, res) => {
        try {
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            const skip = (page - 1) * limit;
            const status = req.query.status;
            const movieId = req.query.movieId;
            const where = {};
            if (status)
                where.status = status;
            if (movieId)
                where.movieId = movieId;
            const [total, items] = await Promise.all([
                prisma.review.count({ where }),
                prisma.review.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    include: {
                        user: { select: { id: true, name: true, email: true, avatar: true } },
                        movie: { select: { id: true, title: true, posterUrl: true } },
                    },
                }),
            ]);
            (0, http_server_1.successResponse)(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    router.patch("/:id/status", ...adminGuard, async (req, res) => {
        try {
            const { status } = req.body;
            const validStatuses = ["APPROVED", "HIDDEN", "REMOVED", "PENDING"];
            if (!status || !validStatuses.includes(status)) {
                return (0, http_server_1.errorResponse)(res, 400, `Status must be one of: ${validStatuses.join(", ")}`);
            }
            const review = await prisma.review.findUnique({ where: { id: req.params.id } });
            if (!review)
                return (0, http_server_1.errorResponse)(res, 404, "Review not found");
            const updated = await prisma.review.update({
                where: { id: req.params.id },
                data: { status: status },
            });
            (0, http_server_1.successResponse)(res, updated);
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    router.delete("/:id", ...adminGuard, async (req, res) => {
        try {
            const review = await prisma.review.findUnique({ where: { id: req.params.id } });
            if (!review)
                return (0, http_server_1.errorResponse)(res, 404, "Review not found");
            await prisma.review.delete({ where: { id: req.params.id } });
            (0, http_server_1.successResponse)(res, null, "Review deleted");
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    return router;
}
