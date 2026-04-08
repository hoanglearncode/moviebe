import { setupCategoryHexagon } from "./modules/category";
import { setupAuthHexagon } from "./modules/auth";

import { createCategoryRepository } from "./modules/category/infras/repository/repo";
import { prisma } from './share/component/prisma';
import { config } from 'dotenv';
import express from 'express';
import cors from "cors";
import { ENV } from "./share/common/value";
import { HashService } from "./modules/auth/shared/hash";
import { Role, UserStatus } from "@prisma/client";

config();
  
(async () => {
  await prisma.$connect();
  console.log('Connection has been established successfully.');

  await ensureAdminUser();

  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());
  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://yourdomain.com",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );


  app.use('/v1', setupCategoryHexagon(createCategoryRepository(prisma)));
  app.use('/v1', setupAuthHexagon(prisma));
  // app.use('/v1', setupProductHexagon(sequelize));

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
})();

async function ensureAdminUser() {
  const email = ENV.ADMIN_INIT_EMAIL;
  const password = ENV.ADMIN_INIT_PASSWORD;

  if (!email || !password) {
    console.warn("ADMIN_INIT_EMAIL or ADMIN_INIT_PASSWORD is not set. Skipping admin bootstrap.");
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

  await prisma.user.create({
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

  console.log(`Admin user created with email ${email}`);
}
