import { CreatePaymentResult, ConfirmMockResult, PaymentMethod } from "../model/model";
import { OrderWithDetails } from "../../booking/model/model";

export interface IPaymentRepository {
  createPaymentForOrder(
    userId: string,
    orderId: string,
    paymentMethod: PaymentMethod,
  ): Promise<CreatePaymentResult>;
  getOrderStatus(userId: string, orderId: string): Promise<OrderWithDetails>;
  confirmMockPayment(
    orderId: string,
    gatewayRef: string,
    status: "SUCCESS" | "FAILED",
  ): Promise<ConfirmMockResult>;
}

export interface IPaymentUseCase {
  createPayment(userId: string, orderId: string, paymentMethod: PaymentMethod): Promise<CreatePaymentResult>;
  getPaymentStatus(userId: string, orderId: string): Promise<OrderWithDetails>;
  confirmMockPayment(
    orderId: string,
    gatewayRef: string,
    status: "SUCCESS" | "FAILED",
  ): Promise<ConfirmMockResult>;
}
