"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWithdrawalModel = exports.getPartnerWalletModel = exports.getPartnerModel = exports.getCheckInModel = exports.getPassHistoryModel = exports.getTransactionModel = exports.getReviewModel = exports.getMovieModel = exports.getShowtimeModel = exports.getSeatModel = exports.getTicketModel = exports.getEmailTokenModel = exports.getPasswordTokenModel = exports.getSessionModel = exports.getUserSettingModel = exports.getUserModel = void 0;
// 🧑 Core
const getUserModel = (prisma) => prisma.user;
exports.getUserModel = getUserModel;
// ⚙️ Settings
const getUserSettingModel = (prisma) => prisma.userSetting;
exports.getUserSettingModel = getUserSettingModel;
// 🔐 Auth
const getSessionModel = (prisma) => prisma.session;
exports.getSessionModel = getSessionModel;
const getPasswordTokenModel = (prisma) => prisma.passwordResetToken;
exports.getPasswordTokenModel = getPasswordTokenModel;
const getEmailTokenModel = (prisma) => prisma.emailVerificationToken;
exports.getEmailTokenModel = getEmailTokenModel;
// 🎟️ Booking
const getTicketModel = (prisma) => prisma.ticket;
exports.getTicketModel = getTicketModel;
const getSeatModel = (prisma) => prisma.seat;
exports.getSeatModel = getSeatModel;
const getShowtimeModel = (prisma) => prisma.showtime;
exports.getShowtimeModel = getShowtimeModel;
const getMovieModel = (prisma) => prisma.movie;
exports.getMovieModel = getMovieModel;
const getReviewModel = (prisma) => prisma.review;
exports.getReviewModel = getReviewModel;
const getTransactionModel = (prisma) => prisma.transaction;
exports.getTransactionModel = getTransactionModel;
const getPassHistoryModel = (prisma) => prisma.passHistory;
exports.getPassHistoryModel = getPassHistoryModel;
const getCheckInModel = (prisma) => prisma.checkIn;
exports.getCheckInModel = getCheckInModel;
const getPartnerModel = (prisma) => prisma.partner;
exports.getPartnerModel = getPartnerModel;
const getPartnerWalletModel = (prisma) => prisma.partnerWallet;
exports.getPartnerWalletModel = getPartnerWalletModel;
const getWithdrawalModel = (prisma) => prisma.withdrawal;
exports.getWithdrawalModel = getWithdrawalModel;
