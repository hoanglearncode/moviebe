import { IBookingRepository, IBookingUseCase } from "../interface";
import { LockSeatsDTO, LockSeatsResult } from "../model/dto";
import { OrderWithDetails } from "../model/model";
import {
  OrderNotFoundError,
  OrderAccessDeniedError,
  OrderAlreadyCompletedError,
} from "../model/error";

export class BookingUseCase implements IBookingUseCase {
  constructor(private readonly repo: IBookingRepository) {}

  async lockSeats(userId: string, data: LockSeatsDTO): Promise<LockSeatsResult> {
    return this.repo.lockSeatsAtomic({ userId, ...data });
  }

  async getOrder(userId: string, orderId: string): Promise<OrderWithDetails> {
    const order = await this.repo.findOrderWithDetails(orderId);
    if (!order) throw new OrderNotFoundError();
    if (order.userId !== userId) throw new OrderAccessDeniedError();

    // Auto-expire if time has passed
    if (
      (order.status === "PENDING" || order.status === "PAYMENT_PROCESSING") &&
      new Date(order.expiresAt) < new Date()
    ) {
      await this.repo.releaseOrderSeats(orderId);
      await this.repo.updateOrder(orderId, { status: "EXPIRED", updatedAt: new Date() });
      return { ...order, status: "EXPIRED" };
    }

    return order;
  }

  async cancelOrder(userId: string, orderId: string): Promise<void> {
    const order = await this.repo.findOrderById(orderId);
    if (!order) throw new OrderNotFoundError();
    if (order.userId !== userId) throw new OrderAccessDeniedError();
    if (order.status === "COMPLETED") throw new OrderAlreadyCompletedError();
    if (order.status === "CANCELLED" || order.status === "EXPIRED") return;

    await this.repo.releaseOrderSeats(orderId);
    await this.repo.updateOrder(orderId, { status: "CANCELLED", updatedAt: new Date() });
  }
}
