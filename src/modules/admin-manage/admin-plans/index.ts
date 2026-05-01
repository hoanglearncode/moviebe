import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { protect, requireRole } from "@/share/middleware/auth";
import { successResponse, errorResponse } from "@/share/transport/http-server";

const adminGuard = [...protect(requireRole("ADMIN"))];

export function buildAdminPlansRouter(prisma: PrismaClient): Router {
  const router = Router();

  // GET /v1/admin/plans
  router.get("/", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const items = await prisma.plan.findMany({ orderBy: { price: "asc" } });
      successResponse(res, { items, total: items.length });
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // POST /v1/admin/plans
  router.post("/", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const { name, slug, price, yearlyPrice, description, maxDevices, quality, isActive, isPopular, color, icon, features } = req.body;

      if (!name || !slug || price === undefined || !description) {
        return errorResponse(res, 400, "name, slug, price, description are required");
      }

      const exists = await prisma.plan.findUnique({ where: { slug } });
      if (exists) return errorResponse(res, 409, `Plan with slug '${slug}' already exists`);

      const plan = await prisma.plan.create({
        data: {
          name,
          slug,
          price,
          yearlyPrice: yearlyPrice ?? null,
          description,
          maxDevices: maxDevices ?? 1,
          quality: quality ?? "HD",
          isActive: isActive ?? true,
          isPopular: isPopular ?? false,
          color: color ?? "zinc",
          icon: icon ?? "star",
          features: features ?? [],
        },
      });

      successResponse(res, plan, "Plan created", 201);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // PATCH /v1/admin/plans/:id
  router.patch("/:id", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const existing = await prisma.plan.findUnique({ where: { id: req.params.id } });
      if (!existing) return errorResponse(res, 404, "Plan not found");

      const { name, slug, price, yearlyPrice, description, maxDevices, quality, isActive, isPopular, color, icon, features } = req.body;

      if (slug && slug !== existing.slug) {
        const conflict = await prisma.plan.findUnique({ where: { slug } });
        if (conflict) return errorResponse(res, 409, `Plan with slug '${slug}' already exists`);
      }

      const updated = await prisma.plan.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined && { name }),
          ...(slug !== undefined && { slug }),
          ...(price !== undefined && { price }),
          ...(yearlyPrice !== undefined && { yearlyPrice }),
          ...(description !== undefined && { description }),
          ...(maxDevices !== undefined && { maxDevices }),
          ...(quality !== undefined && { quality }),
          ...(isActive !== undefined && { isActive }),
          ...(isPopular !== undefined && { isPopular }),
          ...(color !== undefined && { color }),
          ...(icon !== undefined && { icon }),
          ...(features !== undefined && { features }),
        },
      });

      successResponse(res, updated);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // PATCH /v1/admin/plans/:id/toggle
  router.patch("/:id/toggle", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const existing = await prisma.plan.findUnique({ where: { id: req.params.id } });
      if (!existing) return errorResponse(res, 404, "Plan not found");

      const updated = await prisma.plan.update({
        where: { id: req.params.id },
        data: { isActive: !existing.isActive },
      });

      successResponse(res, updated, `Plan ${updated.isActive ? "activated" : "deactivated"}`);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  // DELETE /v1/admin/plans/:id
  router.delete("/:id", ...adminGuard, async (req: Request, res: Response) => {
    try {
      const existing = await prisma.plan.findUnique({ where: { id: req.params.id } });
      if (!existing) return errorResponse(res, 404, "Plan not found");

      await prisma.plan.delete({ where: { id: req.params.id } });
      successResponse(res, null, "Plan deleted");
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  });

  return router;
}
