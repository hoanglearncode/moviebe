import { IUserTicketRepository, IUserTicketUseCase } from "@/modules/ticket/interface";
import { UserTicket, TicketListResult } from "@/modules/ticket/model/model";
import { ListTicketsDTO } from "@/modules/ticket/model/dto";
import { TicketNotFoundError, TicketAccessDeniedError } from "@/modules/ticket/model/error";

export class UserTicketUseCase implements IUserTicketUseCase {
  constructor(private readonly repo: IUserTicketRepository) {}

  async getMyTickets(userId: string, query: ListTicketsDTO): Promise<TicketListResult> {
    return this.repo.findByUserId(userId, query);
  }

  async getTicketDetail(userId: string, ticketId: string): Promise<UserTicket> {
    const ticket = await this.repo.findByIdAndUserId(ticketId, userId);
    if (!ticket) throw new TicketNotFoundError();
    return ticket;
  }
}
