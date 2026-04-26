"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockSeatsDTOSchema = void 0;
const zod_1 = require("zod");
exports.LockSeatsDTOSchema = zod_1.z.object({
    showtimeId: zod_1.z.string().min(1, "Showtime ID is required"),
    seatIds: zod_1.z
        .array(zod_1.z.string().min(1))
        .min(1, "At least one seat is required")
        .max(8, "Maximum 8 seats per booking"),
});
