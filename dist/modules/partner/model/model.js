/**
 * ==========================================
 * PARTNER PROFILE MODEL
 * ==========================================
 */
/**
 * ==========================================
 * ROOM MODEL
 * ==========================================
 */
export var RoomType;
(function (RoomType) {
    RoomType["TWO_D"] = "TWO_D";
    RoomType["THREE_D"] = "THREE_D";
    RoomType["IMAX"] = "IMAX";
    RoomType["VIP"] = "VIP";
    RoomType["FOUR_DX"] = "FOUR_DX";
})(RoomType || (RoomType = {}));
export var RoomStatus;
(function (RoomStatus) {
    RoomStatus["ACTIVE"] = "ACTIVE";
    RoomStatus["INACTIVE"] = "INACTIVE";
    RoomStatus["MAINTENANCE"] = "MAINTENANCE";
})(RoomStatus || (RoomStatus = {}));
/**
 * ==========================================
 * SEAT MODEL & CONSTANTS
 * ==========================================
 */
export var SeatType;
(function (SeatType) {
    SeatType["STANDARD"] = "STANDARD";
    SeatType["VIP"] = "VIP";
    SeatType["COUPLE"] = "COUPLE";
    SeatType["BLOCKED"] = "BLOCKED";
})(SeatType || (SeatType = {}));
export var SeatStatus;
(function (SeatStatus) {
    SeatStatus["AVAILABLE"] = "AVAILABLE";
    SeatStatus["LOCKED"] = "LOCKED";
    SeatStatus["BOOKED"] = "BOOKED";
    SeatStatus["MAINTENANCE"] = "MAINTENANCE";
})(SeatStatus || (SeatStatus = {}));
/**
 * ==========================================
 * TICKET MODEL
 * ==========================================
 */
export var TicketStatus;
(function (TicketStatus) {
    TicketStatus["RESERVED"] = "RESERVED";
    TicketStatus["CONFIRMED"] = "CONFIRMED";
    TicketStatus["USED"] = "USED";
    TicketStatus["CANCELLED"] = "CANCELLED";
    TicketStatus["REFUNDED"] = "REFUNDED";
    TicketStatus["PASSED"] = "PASSED";
})(TicketStatus || (TicketStatus = {}));
/**
 * ==========================================
 * TRANSACTION & WALLET MODEL
 * ==========================================
 */
export var TransactionType;
(function (TransactionType) {
    TransactionType["TICKET_SALE"] = "TICKET_SALE";
    TransactionType["COMMISSION_DEDUCTED"] = "COMMISSION_DEDUCTED";
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
    TransactionType["REFUND"] = "REFUND";
    TransactionType["BONUS"] = "BONUS";
    TransactionType["PENALTY"] = "PENALTY";
})(TransactionType || (TransactionType = {}));
export var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["COMPLETED"] = "COMPLETED";
    TransactionStatus["FAILED"] = "FAILED";
    TransactionStatus["CANCELLED"] = "CANCELLED";
})(TransactionStatus || (TransactionStatus = {}));
/**
 * ==========================================
 * WITHDRAWAL MODEL
 * ==========================================
 */
export var WithdrawalStatus;
(function (WithdrawalStatus) {
    WithdrawalStatus["PENDING"] = "PENDING";
    WithdrawalStatus["PROCESSING"] = "PROCESSING";
    WithdrawalStatus["COMPLETED"] = "COMPLETED";
    WithdrawalStatus["FAILED"] = "FAILED";
    WithdrawalStatus["CANCELLED"] = "CANCELLED";
})(WithdrawalStatus || (WithdrawalStatus = {}));
export var StaffRole;
(function (StaffRole) {
    StaffRole["OWNER"] = "OWNER";
    StaffRole["MANAGER"] = "MANAGER";
    StaffRole["CASHIER"] = "CASHIER";
    StaffRole["SCANNER"] = "SCANNER";
    StaffRole["STAFF"] = "STAFF";
})(StaffRole || (StaffRole = {}));
