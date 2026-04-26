"use strict";
/**
 * ==========================================
 * PARTNER PROFILE MODEL
 * ==========================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffRole = exports.WithdrawalStatus = exports.TransactionStatus = exports.TransactionType = exports.TicketStatus = exports.SeatStatus = exports.SeatType = exports.RoomStatus = exports.RoomType = void 0;
/**
 * ==========================================
 * ROOM MODEL
 * ==========================================
 */
var RoomType;
(function (RoomType) {
    RoomType["TWO_D"] = "TWO_D";
    RoomType["THREE_D"] = "THREE_D";
    RoomType["IMAX"] = "IMAX";
    RoomType["VIP"] = "VIP";
    RoomType["FOUR_DX"] = "FOUR_DX";
})(RoomType || (exports.RoomType = RoomType = {}));
var RoomStatus;
(function (RoomStatus) {
    RoomStatus["ACTIVE"] = "ACTIVE";
    RoomStatus["INACTIVE"] = "INACTIVE";
    RoomStatus["MAINTENANCE"] = "MAINTENANCE";
})(RoomStatus || (exports.RoomStatus = RoomStatus = {}));
/**
 * ==========================================
 * SEAT MODEL & CONSTANTS
 * ==========================================
 */
var SeatType;
(function (SeatType) {
    SeatType["STANDARD"] = "STANDARD";
    SeatType["VIP"] = "VIP";
    SeatType["COUPLE"] = "COUPLE";
    SeatType["BLOCKED"] = "BLOCKED";
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
    TicketStatus["PASSED"] = "PASSED";
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
var StaffRole;
(function (StaffRole) {
    StaffRole["OWNER"] = "OWNER";
    StaffRole["MANAGER"] = "MANAGER";
    StaffRole["CASHIER"] = "CASHIER";
    StaffRole["SCANNER"] = "SCANNER";
    StaffRole["STAFF"] = "STAFF";
})(StaffRole || (exports.StaffRole = StaffRole = {}));
