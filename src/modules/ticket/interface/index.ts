import { UserTicket, TicketListResult } from "@/modules/ticket/model/model";
import { ListTicketsDTO } from "@/modules/ticket/model/dto";

export interface IUserTicketRepository {
  findByUserId(userId: string, query: ListTicketsDTO): Promise<TicketListResult>;
  findByIdAndUserId(ticketId: string, userId: string): Promise<UserTicket | null>;
}

export interface IUserTicketUseCase {
  getMyTickets(userId: string, query: ListTicketsDTO): Promise<TicketListResult>;
  getTicketDetail(userId: string, ticketId: string): Promise<UserTicket>;
}
