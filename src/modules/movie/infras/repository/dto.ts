import { Prisma, PrismaClient } from "@prisma/client";

export const getMovieRepo = (prisma: PrismaClient) => prisma.movie;
