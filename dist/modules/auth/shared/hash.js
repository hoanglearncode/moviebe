import bcrypt from "bcrypt";
const saltRounds = 10;
export class HashService {
    async hash(rawValue) {
        return bcrypt.hash(rawValue, saltRounds);
    }
    async compare(rawValue, hashedValue) {
        return bcrypt.compare(rawValue, hashedValue);
    }
}
