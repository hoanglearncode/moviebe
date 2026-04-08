import bcrypt from "bcrypt";
import { IPasswordHasher } from "../interface";

/**
 * Password Hashing Service using bcrypt
 */
export class HashService implements IPasswordHasher {
  private readonly saltRounds = 10;

  async hash(rawValue: string): Promise<string> {
    return bcrypt.hash(rawValue, this.saltRounds);
  }

  async compare(rawValue: string, hashedValue: string): Promise<boolean> {
    return bcrypt.compare(rawValue, hashedValue);
  }
}
