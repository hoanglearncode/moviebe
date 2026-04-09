import { PrismaClient } from "@prisma/client";

// 🧑 Core
export const getUserModel = (prisma: PrismaClient) => prisma.user;

// ⚙️ Settings
export const getUserSettingModel = (prisma: PrismaClient) => prisma.userSetting;

// 🔐 Auth
export const getSessionModel = (prisma: PrismaClient) => prisma.session;
export const getPasswordTokenModel = (prisma: PrismaClient) => prisma.passwordResetToken;
export const getEmailTokenModel = (prisma: PrismaClient) => prisma.emailVerificationToken;

// 🎟️ Booking
export const getTicketModel = (prisma: PrismaClient) => prisma.ticket;
export const getSeatModel = (prisma: PrismaClient) => prisma.seat;
export const getShowtimeModel = (prisma: PrismaClient) => prisma.showtime;

export const getMovieModel = (prisma: PrismaClient) => prisma.movie;
export const getReviewModel = (prisma: PrismaClient) => prisma.review;

export const getTransactionModel = (prisma: PrismaClient) => prisma.transaction;

export const getPassHistoryModel = (prisma: PrismaClient) => prisma.passHistory;

export const getCheckInModel = (prisma: PrismaClient) => prisma.checkIn;

export const getPartnerModel = (prisma: PrismaClient) => prisma.partner;
export const getPartnerWalletModel = (prisma: PrismaClient) => prisma.partnerWallet;
export const getWithdrawalModel = (prisma: PrismaClient) => prisma.withdrawal;