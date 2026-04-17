import { z } from "zod";

export const UpdateUserSettingSchema = z.object({
  notifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  shareHistory: z.boolean().optional(),
  personalizedRecs: z.boolean().optional(),
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
}
