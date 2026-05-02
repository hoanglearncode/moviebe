import { IPaymentRepository, IPaymentUseCase } from "@/modules/payment/interface";
import {
  CreatePaymentResult,
  ConfirmMockResult,
  PaymentMethod,
} from "@/modules/payment/model/model";
import { OrderWithDetails } from "@/modules/booking/model/model";

export class PaymentUseCase implements IPaymentUseCase {
  constructor(private readonly repo: IPaymentRepository) {}

  async createPayment(
    userId: string,
    orderId: string,
    paymentMethod: PaymentMethod,
  ): Promise<CreatePaymentResult> {
    return this.repo.createPaymentForOrder(userId, orderId, paymentMethod);
  }

  async getPaymentStatus(userId: string, orderId: string): Promise<OrderWithDetails> {
    return this.repo.getOrderStatus(userId, orderId);
  }

  async confirmMockPayment(
    orderId: string,
    gatewayRef: string,
    status: "SUCCESS" | "FAILED",
  ): Promise<ConfirmMockResult> {
    return this.repo.confirmMockPayment(orderId, gatewayRef, status);
  }
}
