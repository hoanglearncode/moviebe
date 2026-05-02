import { setupCategoryHexagon } from "@/modules/category";
import { setupAuthHexagon } from "@/modules/auth";
import { setupUserHexagon } from "./modules/admin-manage/admin-user";
import {
  setupPartnerHexagon,
  setupAdminPartnerHexagon,
  setupUserPartnerHexagon,
} from "@/modules/partner";

import { createCategoryRepository } from "@/modules/category/infras/repository/repo";
import { prisma } from "@/share/component/prisma";
import { config } from "dotenv";
import { initSystemSettingsService } from "@/modules/admin-manage/admin-system-settings";
import express from "express";
import cors from "cors";
import { ENV } from "@/share/common/value";
import { HashService } from "@/modules/auth/shared/hash";
import { Role, UserStatus } from "@prisma/client";
import { logger } from "@/modules/system/log/logger";
import { requestLogger } from "@/modules/system/log/request-logger";
import { initializeQueueInfrastructure, shutdownQueueInfrastructure } from "@/queue";

import { createUploadRouter } from "@/share/transport/upload.router";
import { pusherAuthRouter } from "@/share/transport/pusher-auth.router";
import { defaultSettings } from "@/share/common/seed-setting";
import { seedEmailTemplates } from "@/modules/notification/shared/seed";
import { seedDefaults } from "@/share/common/seed-defaults";
import adminEmailRouter from "@/modules/notification/infras/transport/admin-endpoints";
import { notificationRouter } from "@/modules/notification";
import { setupPublicMovieRoutes, setupPublicShowtimeRoutes } from "@/modules/movie";
import { buildBookingRouter } from "@/modules/booking";
import { buildPaymentRouter } from "@/modules/payment";
import { buildTicketRouter } from "@/modules/ticket";
import { buildAdminAnalyticsRouter } from "./modules/admin-manage/admin-analytics";
import { buildAdminFinanceRouter } from "./modules/admin-manage/admin-finance";
import { buildCinemaRouter } from "@/modules/cinema";
import { buildAdminReviewsRouter } from "./modules/admin-manage/admin-reviews";
import { buildAdminNotificationsRouter } from "./modules/admin-manage/admin-notifications";
import { buildAdminReportsRouter } from "./modules/admin-manage/admin-reports";
import { buildAdminFeatureFlagsRouter } from "./modules/admin-manage/admin-feature-flags";
import { buildAdminAuditLogsRouter } from "./modules/admin-manage/admin-audit-logs";
import { buildAdminPlansRouter } from "./modules/admin-manage/admin-plans";
import {
  buildAdminSystemSettingsRouter,
  getSystemSettingsService,
} from "./modules/admin-manage/admin-system-settings";
import { maintenanceModeGuard } from "@/share/middleware/maintenance";

config();

(async () => {
  await prisma.$connect();
  logger.info("Database connected successfully");
  initSystemSettingsService(prisma);
  await initializeQueueInfrastructure();

  await seedEmailTemplates(prisma);
  await seedDefaults(prisma);

  await ensureAdminUser();

  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());
  app.use(requestLogger);
  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:5173",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  // Public settings endpoint — accessible even in maintenance mode
  app.get("/v1/settings", async (req, res) => {
    try {
      const svc = getSystemSettingsService();
      const [siteName, defaultLanguage, timezone, maintenanceMode, registrationOpen] =
        await Promise.all([
          svc.get("siteName"),
          svc.get("defaultLanguage"),
          svc.get("timezone"),
          svc.get("maintenanceMode"),
          svc.get("registrationOpen"),
        ]);
      res.json({
        success: true,
        data: {
          siteName,
          defaultLanguage,
          timezone,
          maintenanceMode: maintenanceMode === "true",
          registrationOpen: registrationOpen === "true",
        },
      });
    } catch {
      res.json({
        success: true,
        data: {
          siteName: "CineMax",
          defaultLanguage: "vi",
          timezone: "Asia/Ho_Chi_Minh",
          maintenanceMode: false,
          registrationOpen: true,
        },
      });
    }
  });

  app.use(maintenanceModeGuard);

  app.use("/v1", createUploadRouter());
  app.use("/v1", pusherAuthRouter);

  app.use("/v1", setupCategoryHexagon(createCategoryRepository(prisma)));
  app.use("/v1", setupAuthHexagon(prisma));
  app.use("/v1", setupUserHexagon(prisma));
  app.use("/v1/user", setupUserPartnerHexagon(prisma));
  app.use("/v1/admin", setupAdminPartnerHexagon(prisma));
  app.use("/v1/partner", setupPartnerHexagon(prisma));
  app.use("/v1/movies", setupPublicMovieRoutes(prisma));
  app.use("/v1/showtimes", setupPublicShowtimeRoutes(prisma));
  app.use("/v1/booking", buildBookingRouter(prisma));
  app.use("/v1/payment", buildPaymentRouter(prisma));
  app.use("/v1/tickets", buildTicketRouter(prisma));

  app.use("/v1/admin/email", adminEmailRouter);
  app.use("/v1/admin/analytics", buildAdminAnalyticsRouter(prisma));
  app.use("/v1/admin/finance", buildAdminFinanceRouter(prisma));
  app.use("/v1/admin/reviews", buildAdminReviewsRouter(prisma));

  app.use("/v1/cinemas", buildCinemaRouter(prisma));

  app.use("/v1/admin/broadcast-notifications", buildAdminNotificationsRouter(prisma));
  app.use("/v1/admin/reports", buildAdminReportsRouter(prisma));
  app.use("/v1/admin/feature-flags", buildAdminFeatureFlagsRouter(prisma));
  app.use("/v1/admin/audit-logs", buildAdminAuditLogsRouter(prisma));
  app.use("/v1/admin/plans", buildAdminPlansRouter(prisma));
  app.use("/v1/admin/system-settings", buildAdminSystemSettingsRouter(prisma));

  app.use("/v1/notifications", notificationRouter);

  app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
  });
})();

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down application`);
  await shutdownQueueInfrastructure();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

async function ensureAdminUser() {
  const email = ENV.ADMIN_INIT_EMAIL;
  const password = ENV.ADMIN_INIT_PASSWORD;

  if (!email || !password) {
    logger.warn("ADMIN_INIT_EMAIL or ADMIN_INIT_PASSWORD is not set. Skipping admin bootstrap.");
    return;
  }

  const existing = await prisma.user.findFirst({
    where: { email, role: Role.ADMIN },
  });

  if (existing) {
    return;
  }

  const hashService = new HashService();
  const passwordHash = await hashService.hash(password);

  const data = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      username: "admin",
      name: "Administrator",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      provider: "local",
    },
  });

  await prisma.userSetting.create({
    data: {
      userId: data.id,
      ...defaultSettings,
    },
  });

  logger.info("Admin user created", { email });
}
