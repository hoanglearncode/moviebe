/**
 * Avatar Color Service
 * Generates and manages default avatar color themes for users
 */

import { AVATAR_COLORS } from "../model/constants";

export interface IAvatarColorService {
  generateAvatarColor(identifier: string): string;
  getRandomAvatarColor(): string;
}

export class AvatarColorService implements IAvatarColorService {
  /**
   * Generate deterministic avatar color based on email/username
   * Ensures same user always gets same color
   */
  generateAvatarColor(identifier: string): string {
    let hash = 0;
    
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }

  /**
   * Get random avatar color from palette
   */
  getRandomAvatarColor(): string {
    const randomIndex = Math.floor(Math.random() * AVATAR_COLORS.length);
    return AVATAR_COLORS[randomIndex];
  }
}
