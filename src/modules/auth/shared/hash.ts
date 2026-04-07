import { IPasswordHasher } from "../interface";
import bcrypt from "bcrypt";

const saltRounds = 10;

export class HashService implements IPasswordHasher {
    async hash(rawValue: string): Promise<string> {
        return bcrypt.hash(rawValue, saltRounds);
    }

    async compare(rawValue: string, hashedValue: string): Promise<boolean> {
        return bcrypt.compare(rawValue, hashedValue);
    }
}