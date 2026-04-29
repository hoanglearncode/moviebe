import { Order, OrderWithDetails } from "../model/model";
import { LockSeatsDTO, LockSeatsResult } from "../model/dto";

export interface IBookingRepository {
  findOrderById(orderId: string): Promise<Order | null>;
  findOrderWithDetails(orderId: string): Promise<OrderWithDetails | null>;
  updateOrder(id: string, data: Partial<Order>): Promise<boolean>;
  lockSeatsAtomic(params: { userId: string } & LockSeatsDTO): Promise<LockSeatsResult>;
  releaseOrderSeats(orderId: string): Promise<void>;
}

export interface IBookingUseCase {
  lockSeats(userId: string, data: LockSeatsDTO): Promise<LockSeatsResult>;
  getOrder(userId: string, orderId: string): Promise<OrderWithDetails>;
  cancelOrder(userId: string, orderId: string): Promise<void>;
}
