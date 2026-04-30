import { UpdateSettingsDTO } from "../../../user/model/dto";
import { UserSetting } from "@/modules/system/setting/model/model";

export interface IUserSetting {
  get(userId: string): Promise<UserSetting | null>;
  update(userId: string, data: UpdateSettingsDTO): Promise<boolean>;
  reset(userId: string): Promise<boolean>;
  default(userId: string): Promise<boolean>;
}
