// Space themes, defined once as tokens so the public page and embed can reuse them.
// Keys match the Prisma `Theme` enum.

export const THEME_KEYS = ["light", "dark", "sunset", "ocean"] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];

export type ThemeTokens = {
  label: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  accent: string;
  accentText: string;
  border: string;
};

export const THEMES: Record<ThemeKey, ThemeTokens> = {
  light: {
    label: "Light",
    background: "#ffffff",
    surface: "#f4f4f5",
    text: "#18181b",
    mutedText: "#71717a",
    accent: "#18181b",
    accentText: "#ffffff",
    border: "#e4e4e7",
  },
  dark: {
    label: "Dark",
    background: "#0f0f12",
    surface: "#1c1c21",
    text: "#fafafa",
    mutedText: "#a1a1aa",
    accent: "#fafafa",
    accentText: "#0f0f12",
    border: "#2e2e35",
  },
  sunset: {
    label: "Sunset",
    background: "#fff4ec",
    surface: "#ffe1cc",
    text: "#431407",
    mutedText: "#9a3412",
    accent: "#ea580c",
    accentText: "#ffffff",
    border: "#fdba74",
  },
  ocean: {
    label: "Ocean",
    background: "#effaff",
    surface: "#d3f0fb",
    text: "#082f49",
    mutedText: "#0c6a94",
    accent: "#0284c7",
    accentText: "#ffffff",
    border: "#7dd3fc",
  },
};
