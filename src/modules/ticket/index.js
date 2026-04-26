"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTicketRouter = void 0;
const express_1 = require("express");
const repo_1 = require("./infras/repository/repo");
const index_1 = require("./usecase/index");
const http_service_1 = require("./infras/transport/http-service");
const auth_1 = require("../../share/middleware/auth");
const http_server_1 = require("../../share/transport/http-server");
const buildTicketRouter = (prisma) => {
    const repo = new repo_1.UserTicketRepository(prisma);
    const useCase = new index_1.UserTicketUseCase(repo);
    const controller = new http_service_1.UserTicketHttpService(useCase);
    const router = (0, express_1.Router)();
    const guard = [auth_1.authMiddleware, auth_1.requireActiveUser];
    // List user's own tickets
    router.get("/", ...guard, (req, res) => controller.getMyTickets(req, res));
    // Pass history - must come before /:ticketId to avoid route conflict
    router.get("/pass-history", ...guard, async (req, res) => {
        try {
            const userId = req.user.id;
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            const skip = (page - 1) * limit;
            const direction = req.query.direction; // "sent" | "received"
            const where = {};
            if (direction === "sent")
                where.fromUserId = userId;
            else if (direction === "received")
                where.toUserId = userId;
            else
                where.OR = [{ fromUserId: userId }, { toUserId: userId }];
            const [total, items] = await Promise.all([
                prisma.passHistory.count({ where }),
                prisma.passHistory.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { transferredAt: "desc" },
                    include: {
                        ticket: {
                            select: {
                                id: true,
                                seatNumber: true,
                                qrCode: true,
                                movie: { select: { id: true, title: true, posterUrl: true } },
                                showtime: { select: { id: true, startTime: true, endTime: true } },
                            },
                        },
                        fromUser: { select: { id: true, name: true, email: true, avatar: true } },
                        toUser: { select: { id: true, name: true, email: true, avatar: true } },
                    },
                }),
            ]);
            (0, http_server_1.successResponse)(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
        }
        catch (err) {
            (0, http_server_1.errorResponse)(res, 500, err.message);
        }
    });
    // Get single ticket detail
    router.get("/:ticketId", ...guard, (req, res) => controller.getTicketDetail(req, res));
    return router;
};
exports.buildTicketRouter = buildTicketRouter;
