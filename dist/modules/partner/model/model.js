"use strict";
/**
 * ==========================================
 * PARTNER PROFILE MODEL
 * ==========================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalStatus = exports.TransactionStatus = exports.TransactionType = exports.TicketStatus = exports.SeatStatus = exports.SeatType = void 0;
/**
 * ==========================================
 * SEAT MODEL & CONSTANTS
 * ==========================================
 */
var SeatType;
(function (SeatType) {
    SeatType["STANDARD"] = "STANDARD";
    SeatType["VIP"] = "VIP";
    SeatType["PREMIUM"] = "PREMIUM";
    SeatType["ACCESSIBLE"] = "ACCESSIBLE";
})(SeatType || (exports.SeatType = SeatType = {}));
var SeatStatus;
(function (SeatStatus) {
    SeatStatus["AVAILABLE"] = "AVAILABLE";
    SeatStatus["LOCKED"] = "LOCKED";
    SeatStatus["BOOKED"] = "BOOKED";
    SeatStatus["MAINTENANCE"] = "MAINTENANCE";
})(SeatStatus || (exports.SeatStatus = SeatStatus = {}));
/**
 * ==========================================
 * TICKET MODEL
 * ==========================================
 */
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["RESERVED"] = "RESERVED";
    TicketStatus["CONFIRMED"] = "CONFIRMED";
    TicketStatus["USED"] = "USED";
    TicketStatus["CANCELLED"] = "CANCELLED";
    TicketStatus["REFUNDED"] = "REFUNDED";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
/**
 * ==========================================
 * TRANSACTION & WALLET MODEL
 * ==========================================
 */
var TransactionType;
(function (TransactionType) {
    TransactionType["TICKET_SALE"] = "TICKET_SALE";
    TransactionType["COMMISSION_DEDUCTED"] = "COMMISSION_DEDUCTED";
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
    TransactionType["REFUND"] = "REFUND";
    TransactionType["BONUS"] = "BONUS";
    TransactionType["PENALTY"] = "PENALTY";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["COMPLETED"] = "COMPLETED";
    TransactionStatus["FAILED"] = "FAILED";
    TransactionStatus["CANCELLED"] = "CANCELLED";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
/**
 * ==========================================
 * WITHDRAWAL MODEL
 * ==========================================
 */
var WithdrawalStatus;
(function (WithdrawalStatus) {
    WithdrawalStatus["PENDING"] = "PENDING";
    WithdrawalStatus["PROCESSING"] = "PROCESSING";
    WithdrawalStatus["COMPLETED"] = "COMPLETED";
    WithdrawalStatus["FAILED"] = "FAILED";
    WithdrawalStatus["CANCELLED"] = "CANCELLED";
})(WithdrawalStatus || (exports.WithdrawalStatus = WithdrawalStatus = {}));
