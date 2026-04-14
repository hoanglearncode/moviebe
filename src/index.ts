import { setupCategoryHexagon } from "./modules/category";
import { setupAuthHexagon } from "./modules/auth";
import { setupUserHexagon } from "./modules/user";
import { setupPartnerHexagon, setupPartnerRequestRoutes } from "./modules/partner";
import { setupPublicMovieRoutes } from "./modules/movie";
import { setupBookingRoutes } from "./modules/booking";
import { setupPaymentRoutes } from "./modules/payment";
import { setupTicketRoutes } from "./modules/ticket";

import { createCategoryRepository } from "./modules/category/infras/repository/repo";
import { prisma } from "./share/component/prisma";
import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { ENV } from "./share/common/value";
import { HashService } from "./modules/auth/shared/hash";
import { Role, UserStatus } from "@prisma/client";
import { logger } from "./modules/system/log/logger";
import { requestLogger } from "./modules/system/log/request-logger";
import { initializeQueueInfrastructure, shutdownQueueInfrastructure } from "./queue";

import { createUploadRouter } from "./share/transport/upload.router";
import { defaultSettings } from "./share/common/seed-setting";
import { seedEmailTemplates } from "./modules/notification/shared/seed";
import adminEmailRouter from "./modules/notification/infras/transport/admin-endpoints";
import { notificationRouter } from "./modules/notification";

config();

(async () => {
  await prisma.$connect();
  logger.info("Database connected successfully");
  await initializeQueueInfrastructure();

  await seedEmailTemplates(prisma);

  await ensureAdminUser();

  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());
  app.use(requestLogger);

  app.use(
    cors({
      origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use("/v1", setupCategoryHexagon(createCategoryRepository(prisma)));
  app.use("/v1", setupAuthHexagon(prisma));
  app.use("/v1", setupUserHexagon(prisma));

  app.use("/v1", setupPublicMovieRoutes(prisma));

  // Booking (auth required)
  app.use("/v1", setupBookingRoutes(prisma));

  // Payment (auth required + public webhook)
  app.use("/v1", setupPaymentRoutes(prisma));

  // User tickets (auth required)
  app.use("/v1", setupTicketRoutes(prisma));

  // Partner portal (requires PARTNER role)
  app.use("/v1/partner", setupPartnerHexagon(prisma));

  
  const { userRouter: partnerUserRouter, adminRouter: partnerAdminRouter } = setupPartnerRequestRoutes(prisma);
  app.use("/v1/user", partnerUserRouter);
  app.use("/v1/admin", partnerAdminRouter);

  app.use("/v1", createUploadRouter());
  app.use("/v1/admin/email", adminEmailRouter);

  // In-app push notifications
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
