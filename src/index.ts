import { setupCategoryHexagon } from "./modules/category";
import { setupAuthHexagon } from "./modules/auth";

import { createCategoryRepository } from "./modules/category/infras/repository/repo";
import { prisma } from './share/component/prisma';
import { config } from 'dotenv';
import express from 'express';

config();

(async () => {
  await prisma.$connect();
  console.log('Connection has been established successfully.');

  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());

  app.use('/v1', setupCategoryHexagon(createCategoryRepository(prisma)));
  app.use('/v1', setupAuthHexagon(prisma));
  // app.use('/v1', setupProductHexagon(sequelize));

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
})();
