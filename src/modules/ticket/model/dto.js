"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTicketsDTOSchema = void 0;
const zod_1 = require("zod");
exports.ListTicketsDTOSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(50).default(10),
    status: zod_1.z
        .enum(["RESERVED", "CONFIRMED", "USED", "CANCELLED", "REFUNDED", "PASSED"])
        .optional(),
});
