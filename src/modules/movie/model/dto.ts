
import { z } from "zod";

export const MovieCondDTOSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  rooms: z.string().optional(),
  genres: z.string().optional(),
  showtimes: z.string().optional(),
  rates: z.string().optional(),
  search: z.string().optional()
});


export type MovieCondDTO = z.infer<typeof MovieCondDTOSchema>;
