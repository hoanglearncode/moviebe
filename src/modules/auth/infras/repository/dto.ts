import { PrismaClient } from "@prisma/client";

export const getUserModel = (prisma: PrismaClient) => prisma.user;
export const getSessionModel = (prisma: PrismaClient) => prisma.session;
export const getPasswordTokenModel = (prisma: PrismaClient) => prisma.passwordResetToken;
export const getEmailTokenModel = (prisma: PrismaClient) => prisma.emailVerificationToken;
