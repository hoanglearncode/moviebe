import { z } from "zod";

export type PartnerSetting = {
  id: string;
  partnerId: string;
  notifyNewBooking: boolean;
  notifyWithdrawal: boolean;
  notifyMovieStatus: boolean;
  notifySystemAlerts: boolean;
  notifyRevenueReport: boolean;
  emailNewBooking: boolean;
  emailDailyReport: boolean;
  emailWeeklyReport: boolean;
  emailSystemAlerts: boolean;
  autoWithdrawEnabled: boolean;
  autoWithdrawThreshold: number;
  reportTimezone: string;
  createdAt: Date;
  updatedAt: Date;
};

export const defaultPartnerSettings = {
  notifyNewBooking: true,
  notifyWithdrawal: true,
  notifyMovieStatus: true,
  notifySystemAlerts: true,
  notifyRevenueReport: true,
  emailNewBooking: false,
  emailDailyReport: true,
  emailWeeklyReport: true,
  emailSystemAlerts: true,
  autoWithdrawEnabled: false,
  autoWithdrawThreshold: 5_000_000,
  reportTimezone: "Asia/Ho_Chi_Minh",
} as const;

export const UpdatePartnerSettingSchema = z
  .object({
    notifyNewBooking: z.boolean().optional(),
    notifyWithdrawal: z.boolean().optional(),
    notifyMovieStatus: z.boolean().optional(),
    notifySystemAlerts: z.boolean().optional(),
    notifyRevenueReport: z.boolean().optional(),
    emailNewBooking: z.boolean().optional(),
    emailDailyReport: z.boolean().optional(),
    emailWeeklyReport: z.boolean().optional(),
    emailSystemAlerts: z.boolean().optional(),
    autoWithdrawEnabled: z.boolean().optional(),
    autoWithdrawThreshold: z.number().min(100_000).max(100_000_000).optional(),
    reportTimezone: z.string().min(1).max(64).optional(),
  })
  .strict();

export type PartnerSettingUpdate = z.infer<typeof UpdatePartnerSettingSchema>;
