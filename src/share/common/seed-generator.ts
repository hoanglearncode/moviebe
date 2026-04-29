/**
 * Seed Data Generator - Tạo dữ liệu ngẫu nhiên cho users
 */

interface RandomUserData {
  email: string;
  username: string;
  name: string;
  password: string;
  phone?: string;
  bio?: string;
  location?: string;
}

const FIRST_NAMES = [
  "Nguyễn",
  "Trần",
  "Võ",
  "Phạm",
  "Hoàng",
  "Dương",
  "Bùi",
  "Đỗ",
  "Cao",
  "Đặng",
  "Ngo",
  "Vũ",
  "Tạ",
  "Tô",
  "Từ",
  "Hồ",
  "Lương",
  "Lâm",
  "Tây",
  "Ưu",
  "Anh",
  "Bình",
  "Cường",
  "Dũng",
  "Eminence",
  "Phúc",
  "Giang",
  "Hải",
  "Hạnh",
  "Hào",
  "Hùng",
  "Huy",
  "Hương",
  "Huỳnh",
  "Huyền",
  "Ích",
  "Ích",
  "Ích Lâm",
  "James",
  "John",
  "Alex",
  "Michael",
  "David",
  "Robert",
  "Richard",
  "Christopher",
  "Mark",
  "Daniel",
  "Steven",
  "Paul",
];

const LAST_NAMES = [
  "Văn",
  "Thọ",
  "Chính",
  "Triều",
  "Tấn",
  "Tuấn",
  "Tường",
  "Tuyên",
  "Tùng",
  "Tuệ",
  "Tú",
  "Toàn",
  "Toán",
  "Thiện",
  "Thiệu",
  "Thịnh",
  "Thới",
  "Thông",
  "Thạch",
  "Thái",
  "Tâm",
  "Tân",
  "Tạng",
  "Tạo",
  "Tâu",
  "Tâu",
  "Thắng",
  "Thăng",
  "Thắm",
  "Thân",
  "Thành",
  "Thích",
  "Thịnh",
  "Thống",
  "Thốn",
  "Thương",
  "Thương",
  "Tích",
  "Tiến",
  "Tips",
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
];

const LOCATIONS = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Biên Hòa",
  "Hải Dương",
  "Hà Tĩnh",
  "Thanh Hóa",
  "Nghệ An",
  "Quảng Ninh",
  "Bắc Giang",
  "Bắc Ninh",
  "Hưng Yên",
  "Hà Nam",
  "Nam Định",
  "Ninh Bình",
  "Thanh Hóa",
  "Hà Tĩnh",
  "Quảng Bình",
  "Quảng Trị",
  "Thừa Thiên Huế",
  "Quảng Nam",
  "Quảng Ngãi",
  "Bình Định",
  "Phú Yên",
  "Khánh Hòa",
  "Ninh Thuận",
  "Bình Thuận",
  "Đồng Nai",
  "Bà Rịa - Vũng Tàu",
  "Long An",
  "Tiền Giang",
  "Bến Tre",
  "Trà Vinh",
  "Sóc Trăng",
  "Bạc Liêu",
  "Cà Mau",
  "An Giang",
  "Kiên Giang",
];

const BIO_TEMPLATES = [
  "Passionate about movies and entertainment 🎬",
  "Movie enthusiast | Cinephile | Always looking for great films",
  "Love watching movies and discovering new cinemas",
  "📽️ Film lover | Exploring cinema culture",
  "Dedicated movie watcher! 🍿",
  "Cinema is my second home 🏠",
  "Always up for a movie night 🎭",
  "Film critic in the making",
  "Movie lover since childhood 🎞️",
  "Exploring the world through cinema",
  "Enjoy everything related to movies and series",
  "Cinephile by heart ❤️",
];

export class SeedGenerator {
  private static readonly MIN_ID = 1000;
  private static readonly MAX_ID = 999999;
  private static readonly DEFAULT_DOMAIN = "seeduser.local";

  /**
   * Sinh số ngẫu nhiên trong khoảng [min, max]
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Sinh phần tử ngẫu nhiên từ array
   */
  static randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Sinh email unique
   */
  static generateEmail(index: number): string {
    const randomSuffix = this.randomInt(100000, 999999);
    const variant = index % 3;

    switch (variant) {
      case 0:
        return `user_${index}_${randomSuffix}@${this.DEFAULT_DOMAIN}`;
      case 1:
        return `cinepass_user${index}@${this.DEFAULT_DOMAIN}`;
      case 2:
        return `filmfan_${randomSuffix}_${index}@${this.DEFAULT_DOMAIN}`;
      default:
        return `user${index}@${this.DEFAULT_DOMAIN}`;
    }
  }

  /**
   * Sinh username unique
   */
  static generateUsername(index: number): string {
    const prefixes = ["user", "cinema", "film", "movie", "member", "cinepass"];
    const prefix = this.randomElement(prefixes);
    const randomPart = this.randomInt(1000, 9999);

    return `${prefix}_${index}_${randomPart}`.substring(0, 50);
  }

  /**
   * Sinh tên ngẫu nhiên
   */
  static generateName(): string {
    const lastName = this.randomElement(LAST_NAMES);
    const firstName = this.randomElement(FIRST_NAMES);
    return `${lastName} ${firstName}`;
  }

  /**
   * Sinh password ngẫu nhiên (min 8 characters)
   */
  static generatePassword(): string {
    const length = this.randomInt(8, 12);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";

    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  }

  /**
   * Sinh số điện thoại ngẫu nhiên
   */
  static generatePhone(): string {
    // Format: +84 or 0 followed by 9 digits
    const operators = ["86", "90", "91", "92", "93", "94", "95", "96", "97", "98", "99"];
    const operator = this.randomElement(operators);
    const number = this.randomInt(10000000, 99999999);

    if (Math.random() > 0.5) {
      return `+84${operator}${number}`;
    }
    return `0${operator}${number}`;
  }

  /**
   * Sinh bio ngẫu nhiên
   */
  static generateBio(): string {
    return this.randomElement(BIO_TEMPLATES);
  }

  /**
   * Sinh location ngẫu nhiên
   */
  static generateLocation(): string {
    return this.randomElement(LOCATIONS);
  }

  /**
   * Tạo một user data ngẫu nhiên
   */
  static generateRandomUser(index: number): RandomUserData {
    return {
      email: this.generateEmail(index),
      username: this.generateUsername(index),
      name: this.generateName(),
      password: this.generatePassword(),
      phone: Math.random() > 0.3 ? this.generatePhone() : undefined,
      bio: Math.random() > 0.5 ? this.generateBio() : undefined,
      location: Math.random() > 0.3 ? this.generateLocation() : undefined,
    };
  }

  /**
   * Tạo batch của random users
   */
  static generateUserBatch(count: number, startIndex: number = 0): RandomUserData[] {
    const users: RandomUserData[] = [];

    for (let i = startIndex; i < startIndex + count; i++) {
      users.push(this.generateRandomUser(i));
    }

    return users;
  }
}
