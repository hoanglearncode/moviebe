import { z } from "zod";

export const LockSeatsDTOSchema = z.object({
  showtimeId: z.string().min(1, "Showtime ID is required"),
  seatIds: z
    .array(z.string().min(1))
    .min(1, "At least one seat is required")
    .max(8, "Maximum 8 seats per booking"),
});

export type LockSeatsDTO = z.infer<typeof LockSeatsDTOSchema>;

export interface LockSeatsResult {
  orderId: string;
  expiresAt: string;
  seats: { id: string; seatNumber: string; price: number }[];
  totalAmount: number;
}
