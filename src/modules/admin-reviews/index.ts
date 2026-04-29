import { Router, Request, Response } from "express";
import { PrismaClient, ReviewStatus } from "@prisma/client";
import { protect, requireRole } from "../../share/middleware/auth";
import { successResponse, errorResponse } from "../../share/transport/http-server";

const adminGuard = [...protect(requireRole("ADMIN"))];

export function buildAdminReviewsRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get("/", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const skip = (page - 1) * limit;
      const status = req.query.status as ReviewStatus | undefined;
      const movieId = req.query.movieId as string | undefined;

      const where: any = {};
      if (status) where.status = status;
      if (movieId) where.movieId = movieId;

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

      successResponse(res, { items, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  router.patch("/:id/status", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const validStatuses = ["APPROVED", "HIDDEN", "REMOVED", "PENDING"];
      if (!status || !validStatuses.includes(status)) {
        return errorResponse(res, 400, `Status must be one of: ${validStatuses.join(", ")}`);
      }

      const review = await prisma.review.findUnique({ where: { id: req.params.id } });
      if (!review) return errorResponse(res, 404, "Review not found");

      const updated = await prisma.review.update({
        where: { id: req.params.id },
        data: { status: status as ReviewStatus },
      });

      successResponse(res, updated);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  router.delete("/:id", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const review = await prisma.review.findUnique({ where: { id: req.params.id } });
      if (!review) return errorResponse(res, 404, "Review not found");

      await prisma.review.delete({ where: { id: req.params.id } });
      successResponse(res, null, "Review deleted");
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  return router;
}
