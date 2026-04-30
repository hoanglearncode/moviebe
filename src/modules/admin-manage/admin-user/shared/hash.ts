import bcrypt from "bcrypt";
import { IPasswordHasher } from "@/modules/admin-manage/admin-user/interface";

/**
 * HashService — implementation của IPasswordHasher dùng bcrypt
 *
 * NOTE: SALT_ROUNDS=12 là cân bằng tốt giữa security và performance.
 * Tăng lên 14+ thì an toàn hơn nhưng chậm hơn đáng kể.
 */
export class HashService implements IPasswordHasher {
  private readonly SALT_ROUNDS = 12;

  async hash(rawValue: string): Promise<string> {
    return bcrypt.hash(rawValue, this.SALT_ROUNDS);
  }

  async compare(rawValue: string, hashedValue: string): Promise<boolean> {
    return bcrypt.compare(rawValue, hashedValue);
  }
}
