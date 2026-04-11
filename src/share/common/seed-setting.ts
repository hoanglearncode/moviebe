import { DefaultUserSetting } from "../../modules/system/setting/model/model";

export const defaultSettings: DefaultUserSetting = {
  notifications: true,
  marketingEmails: false,
  pushNotifications: true,
  smsNotifications: false,
  shareHistory: false,
  personalizedRecs: true,

  referralCode: null,
  referrals: 0,

  createdAt: new Date(),
  updatedAt: new Date(),
};
