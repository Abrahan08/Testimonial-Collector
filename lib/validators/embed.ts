import { z } from "zod";

export const EMBED_STYLES = ["masonry", "carousel"] as const;
export const EMBED_SOURCES = ["wall_of_love", "all_visible"] as const;
export type EmbedStyleKey = (typeof EMBED_STYLES)[number];
export type EmbedSourceKey = (typeof EMBED_SOURCES)[number];

export type EmbedOptions = {
  style: EmbedStyleKey;
  dark: boolean;
  animation: boolean;
  /** CSS colour including the leading "#". */
  bg: string;
};

export const EMBED_DEFAULTS: EmbedOptions = {
  style: "masonry",
  dark: false,
  animation: true,
  bg: "#ffffff",
};

// Exactly 3 or 6 hex digits, no "#" (a raw "#" in a URL would start the fragment).
const HEX_DIGITS = /^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
// Stored form: the same digits with a leading "#".
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const hexColorSchema = z.string().regex(HEX_COLOR, "Use a hex colour like #ffffff");

const styleParam = z.enum(EMBED_STYLES);
const boolParam = z.enum(["true", "false"]).transform((v) => v === "true");
const bgParam = z.string().regex(HEX_DIGITS).transform((v) => `#${v}`);

export type EmbedParams = Partial<EmbedOptions>;

// Query params (or data-* attributes) override the saved config. A missing param stays
// undefined so the saved value applies; a present but invalid one falls back to the default.
export function parseEmbedParams(raw: {
  style?: unknown;
  dark?: unknown;
  animation?: unknown;
  bg?: unknown;
}): EmbedParams {
  function pick<T>(value: unknown, schema: z.ZodType<T>, fallback: T): T | undefined {
    if (value === undefined) return undefined;
    const parsed = schema.safeParse(value);
    return parsed.success ? parsed.data : fallback;
  }
  return {
    style: pick(raw.style, styleParam, EMBED_DEFAULTS.style),
    dark: pick(raw.dark, boolParam, EMBED_DEFAULTS.dark),
    animation: pick(raw.animation, boolParam, EMBED_DEFAULTS.animation),
    bg: pick(raw.bg, bgParam, EMBED_DEFAULTS.bg),
  };
}

export type SavedEmbedConfig = {
  style: EmbedStyleKey;
  darkMode: boolean;
  animation: boolean;
  backgroundColor: string;
};

// params > saved config > defaults.
export function resolveEmbedOptions(params: EmbedParams, saved: SavedEmbedConfig | null): EmbedOptions {
  return {
    style: params.style ?? saved?.style ?? EMBED_DEFAULTS.style,
    dark: params.dark ?? saved?.darkMode ?? EMBED_DEFAULTS.dark,
    animation: params.animation ?? saved?.animation ?? EMBED_DEFAULTS.animation,
    bg: params.bg ?? (saved && HEX_COLOR.test(saved.backgroundColor) ? saved.backgroundColor : EMBED_DEFAULTS.bg),
  };
}

export const embedConfigInputSchema = z.object({
  spaceId: z.string().trim().min(1).max(64),
  style: styleParam,
  darkMode: z.boolean(),
  animation: z.boolean(),
  backgroundColor: hexColorSchema,
  source: z.enum(EMBED_SOURCES),
});
export type EmbedConfigInput = z.input<typeof embedConfigInputSchema>;
