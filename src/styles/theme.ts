// Centralised theme tokens. Five-color palette + semantic mappings for light/dark.

export const palette = {
  powderBlush: "#ffa69e",
  vanillaCream: "#faf3dd",
  icyAqua: "#b8f2e6",
  lightBlue: "#aed9e0",
  blueSlate: "#5e6472"
} as const;

export type PaletteName = keyof typeof palette;

export type SemanticTokens = {
  bg: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  mutedText: string;
  accent: string;
  accentSoft: string;
  highlight: string;
  highlightSoft: string;
  secondary: string;
  border: string;
  ring: string;
};

export const lightTheme: SemanticTokens = {
  bg: palette.vanillaCream,
  surface: "#ffffff",
  surfaceMuted: "#fffaf0",
  text: palette.blueSlate,
  mutedText: "#7d8492",
  accent: palette.powderBlush,
  accentSoft: "#ffd7d2",
  highlight: palette.icyAqua,
  highlightSoft: "#d8f7ee",
  secondary: palette.lightBlue,
  border: "#e7decf",
  ring: palette.powderBlush
};

export const darkTheme: SemanticTokens = {
  bg: palette.blueSlate,
  surface: "#4a4f5a",
  surfaceMuted: "#404550",
  text: palette.vanillaCream,
  mutedText: "#cfd3da",
  accent: palette.powderBlush,
  accentSoft: "#7a4944",
  highlight: palette.icyAqua,
  highlightSoft: "#3f6963",
  secondary: palette.lightBlue,
  border: "#6b7280",
  ring: palette.icyAqua
};

export const themes = { light: lightTheme, dark: darkTheme };
export type ThemeName = keyof typeof themes;
