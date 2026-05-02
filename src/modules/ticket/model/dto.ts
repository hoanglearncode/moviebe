import { z } from "zod";

export const ListTicketsDTOSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: z.enum(["RESERVED", "CONFIRMED", "USED", "CANCELLED", "REFUNDED", "PASSED"]).optional(),
});

export type ListTicketsDTO = z.infer<typeof ListTicketsDTOSchema>;
