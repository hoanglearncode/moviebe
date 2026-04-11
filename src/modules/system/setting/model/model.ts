import { z } from "zod";

export const UpdateUserSettingSchema = z.object({
  notifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  publicWatchlist: z.boolean().optional(),
  shareHistory: z.boolean().optional(),
  personalizedRecs: z.boolean().optional(),

  referralCode: z.string().min(3).max(50).optional(),
  referrals: z.number().int().min(0).optional(),
});

export type UserSettingUpdate = z.infer<typeof UpdateUserSettingSchema>;

export interface UserSetting {
  id: string;
  userId: string;
  notifications: boolean;
  marketingEmails: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  shareHistory: boolean;
  personalizedRecs: boolean;
  referralCode: string | null;
  referrals: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DefaultUserSetting {
  notifications: boolean;
  marketingEmails: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  shareHistory: boolean;
  personalizedRecs: boolean;
  referralCode: string | null;
  referrals: number;
  createdAt: Date;
  updatedAt: Date;
}
