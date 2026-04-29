export type PaymentMethod = "VNPAY" | "MOMO" | "ZALOPAY" | "CARD";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface CreatePaymentResult {
  paymentUrl: string;
  transactionId: string;
}

export interface ConfirmMockResult {
  orderId: string;
  status: string;
}
