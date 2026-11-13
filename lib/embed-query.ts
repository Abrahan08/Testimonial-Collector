import type { EmbedSourceKey } from "@/lib/validators/embed";

// Pure helpers behind the embed data, free of Prisma imports so they are easy to test.

export const EMBED_LIMIT = 50;

// Visible means: not hidden AND the customer consented. Wall of Love adds the owner flag.
export function buildEmbedWhere(spaceId: string, source: EmbedSourceKey) {
  return {
    spaceId,
    isHidden: false,
    consentToShare: true,
    ...(source === "wall_of_love" && { isWallOfLove: true }),
  };
}

// Favorites first, then newest; id keeps the order stable.
export const EMBED_ORDER = [{ isFavorite: "desc" as const }, { createdAt: "desc" as const }, { id: "desc" as const }];

// The only columns that ever leave the server for the embed. No email, no consent flag.
export const EMBED_SELECT = {
  name: true,
  company: true,
  rating: true,
  text: true,
  createdAt: true,
  isFavorite: true,
} as const;

export type EmbedTestimonial = {
  name: string;
  company: string | null;
  rating: number | null;
  text: string;
  createdAt: Date;
  isFavorite: boolean;
};
