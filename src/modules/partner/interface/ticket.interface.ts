import { IRepository } from "@/share/interface";
import { Ticket, CheckIn, TicketListResponse } from "@/modules/partner/model/model";
import { CheckInDTO, ListTicketsQueryDTO } from "@/modules/partner/model/dto";

// ─── Repository Ports ─────────────────────────────────────────────────────────

export interface ITicketRepository extends IRepository<Ticket, Partial<Ticket>, Partial<Ticket>> {
  findById(ticketId: string): Promise<Ticket | null>;
  findByQRCode(qrCode: string): Promise<Ticket | null>;
  findByPartnerId(partnerId: string, query: ListTicketsQueryDTO): Promise<TicketListResponse>;
  findByShowtimeId(showtimeId: string): Promise<Ticket[]>;
  updateStatus(ticketId: string, status: string): Promise<boolean>;
}

export interface ICheckInRepository extends IRepository<
  CheckIn,
  Partial<CheckIn>,
  Partial<CheckIn>
> {
  findByTicketId(ticketId: string): Promise<CheckIn | null>;
  findByShowtimeId(showtimeId: string): Promise<CheckIn[]>;
  countByShowtimeId(showtimeId: string): Promise<number>;
}

// ─── Use-Case Port ────────────────────────────────────────────────────────────

export interface ITicketCheckInUseCase {
  getTickets(partnerId: string, query: ListTicketsQueryDTO): Promise<TicketListResponse>;
  getTicketDetail(partnerId: string, ticketId: string): Promise<Ticket>;
  checkInTicket(
    partnerId: string,
    data: CheckInDTO,
  ): Promise<{ message: string; ticketId: string }>;
  getCheckInHistory(partnerId: string, showtimeId: string): Promise<CheckIn[]>;
}
