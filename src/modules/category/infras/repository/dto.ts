import { PrismaClient } from "@prisma/client";

export const getCategoryModel = (prisma: PrismaClient) => prisma.category;
