export const AVATAR_COLORS = [
  "from-pink-600/60 to-rose-700/60 text-pink-200",
  "from-blue-600/60 to-indigo-700/60 text-blue-200",
  "from-emerald-600/60 to-teal-700/60 text-emerald-200",
  "from-violet-600/60 to-purple-700/60 text-violet-200",
  "from-orange-600/60 to-amber-700/60 text-orange-200",
  "from-cyan-600/60 to-sky-700/60 text-cyan-200",
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];
