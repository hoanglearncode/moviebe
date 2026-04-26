"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmMockPaymentDTOSchema = exports.CreatePaymentDTOSchema = void 0;
const zod_1 = require("zod");
exports.CreatePaymentDTOSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1, "Order ID is required"),
    paymentMethod: zod_1.z.enum(["VNPAY", "MOMO", "ZALOPAY", "CARD"]),
});
exports.ConfirmMockPaymentDTOSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1, "Order ID is required"),
    gatewayRef: zod_1.z.string().min(1, "Gateway reference is required"),
    status: zod_1.z.enum(["SUCCESS", "FAILED"]).default("SUCCESS"),
});
