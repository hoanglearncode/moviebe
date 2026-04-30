import { randomUUID } from "crypto";
import {
  ITicketRepository,
  ICheckInRepository,
  ITicketCheckInUseCase,
} from "@/modules/partner/interface/ticket.interface";
import { IShowtimeRepository } from "@/modules/partner/interface/showtime.interface";
import { Ticket, CheckIn, TicketListResponse } from "@/modules/partner/model/model";
import { CheckInDTO, ListTicketsQueryDTO } from "@/modules/partner/model/dto";

export class TicketCheckInUseCase implements ITicketCheckInUseCase {
  constructor(
    private readonly ticketRepo: ITicketRepository,
    private readonly checkInRepo: ICheckInRepository,
    private readonly showtimeRepo: IShowtimeRepository,
  ) {}

  async getTickets(partnerId: string, query: ListTicketsQueryDTO): Promise<TicketListResponse> {
    return this.ticketRepo.findByPartnerId(partnerId, query);
  }

  async getTicketDetail(partnerId: string, ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) throw new Error("Ticket not found");
    if (ticket.partnerId !== partnerId) throw new Error("Ticket does not belong to this partner");
    return ticket;
  }

  async checkInTicket(
    partnerId: string,
    data: CheckInDTO,
  ): Promise<{ message: string; ticketId: string }> {
    const ticket = await this.ticketRepo.findByQRCode(data.qrCode);
    if (!ticket) throw new Error("Invalid QR code");
    if (ticket.partnerId !== partnerId) throw new Error("Ticket does not belong to this partner");

    if (ticket.status !== "CONFIRMED") {
      if (ticket.status === "USED") throw new Error("Ticket has already been used");
      if (ticket.status === "CANCELLED") throw new Error("Ticket is cancelled");
      if (ticket.status === "REFUNDED") throw new Error("Ticket has been refunded");
      throw new Error(`Cannot check in ticket with status: ${ticket.status}`);
    }

    const existingCheckIn = await this.checkInRepo.findByTicketId(ticket.id);
    if (existingCheckIn) throw new Error("Ticket has already been checked in");

    const checkIn: CheckIn = {
      id: randomUUID(),
      ticketId: ticket.id,
      partnerId,
      showtimeId: ticket.showtimeId,
      userId: ticket.userId,
      scannedAt: new Date(),
      scannedBy: data.scannedBy,
      ipAddress: data.ipAddress ?? null,
      deviceInfo: null,
      createdAt: new Date(),
    };

    await this.checkInRepo.insert(checkIn);
    await this.ticketRepo.updateStatus(ticket.id, "USED");

    return { message: "Check-in successful", ticketId: ticket.id };
  }

  async getCheckInHistory(partnerId: string, showtimeId: string): Promise<CheckIn[]> {
    const showtime = await this.showtimeRepo.findByIdAndPartnerId(showtimeId, partnerId);
    if (!showtime) throw new Error("Showtime not found");
    return this.checkInRepo.findByShowtimeId(showtimeId);
  }
}
