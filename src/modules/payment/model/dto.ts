import { z } from "zod";

export const CreatePaymentDTOSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  paymentMethod: z.enum(["VNPAY", "MOMO", "ZALOPAY", "CARD"]),
});

export type CreatePaymentDTO = z.infer<typeof CreatePaymentDTOSchema>;

export const ConfirmMockPaymentDTOSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  gatewayRef: z.string().min(1, "Gateway reference is required"),
  status: z.enum(["SUCCESS", "FAILED"]).default("SUCCESS"),
});

export type ConfirmMockPaymentDTO = z.infer<typeof ConfirmMockPaymentDTOSchema>;
