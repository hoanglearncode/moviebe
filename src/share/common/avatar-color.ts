import { AVATAR_COLORS } from "@/modules/admin-manage/admin-user/model/constants";

export interface IAvatarColorService {
  generateAvatarColor(identifier: string): string;
  getRandomAvatarColor(): string;
}

export class AvatarColorService implements IAvatarColorService {
  generateAvatarColor(identifier: string): string {
    let hash = 0;

    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }

  getRandomAvatarColor(): string {
    const randomIndex = Math.floor(Math.random() * AVATAR_COLORS.length);
    return AVATAR_COLORS[randomIndex];
  }
}
