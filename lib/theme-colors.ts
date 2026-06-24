type Theme = "dark" | "light";

const DARK = {
  bg: "#131313",
  surface: "#201f1f",
  elevated: "#2a2a2a",
  text: "#ffffff",
  textSecondary: "#e5e2e1",
  textMuted: "#c4c9ac",
  textFaint: "rgba(196,201,172,0.35)",
  textOnAccent: "#161e00",
  textOnDark: "#ffffff",
  cardBg: "rgba(28,28,30,0.8)",
  cardBgAlt: "#1c1b1b",
  cardBorder: "rgba(44,44,46,1)",
  inputBg: "rgba(255,255,255,0.07)",
  inputBorder: "rgba(255,255,255,0.12)",
  buttonBg: "rgba(255,255,255,0.08)",
  divider: "rgba(255,255,255,0.07)",
  tabBarBg: "rgba(19,19,19,0.8)",
  tabBarBorder: "rgba(53,53,52,0.2)",
  tabBarInactive: "rgba(229,226,225,0.3)",
  placeholder: "rgba(196,201,172,0.5)",
  overlay: "rgba(0,0,0,0.5)",
} as const;

const LIGHT = {
  bg: "#F6F4EF",
  surface: "#FFFFFF",
  elevated: "#F0EDE8",
  text: "#1A1816",
  textSecondary: "rgba(26,24,22,0.55)",
  textMuted: "rgba(26,24,22,0.35)",
  textFaint: "rgba(26,24,22,0.15)",
  textOnAccent: "#FFFFFF",
  textOnDark: "#FFFFFF",
  cardBg: "#FFFFFF",
  cardBgAlt: "#F0EDE8",
  cardBorder: "rgba(0,0,0,0.06)",
  inputBg: "rgba(0,0,0,0.04)",
  inputBorder: "rgba(0,0,0,0.1)",
  buttonBg: "rgba(0,0,0,0.05)",
  divider: "rgba(0,0,0,0.06)",
  tabBarBg: "#FAFAF7",
  tabBarBorder: "rgba(0,0,0,0.06)",
  tabBarInactive: "rgba(26,24,22,0.35)",
  placeholder: "rgba(26,24,22,0.35)",
  overlay: "rgba(0,0,0,0.5)",
} as const;

export function getThemeColors(theme: Theme) {
  return theme === "dark" ? { ...DARK } : { ...LIGHT };
}

export const ACCENT = {
  mint: "#2DD4A8",
  mintLight: "#5EEAD4",
  mintBg: "rgba(45,212,168,0.12)",
  mintBorder: "rgba(45,212,168,0.3)",
  coral: "#FF6B52",
  coralLight: "#FF8A75",
  coralBg: "rgba(255,107,82,0.12)",
  coralBorder: "rgba(255,107,82,0.3)",
  rose: "#F43F5E",
  roseBg: "rgba(244,63,94,0.12)",
  roseBorder: "rgba(244,63,94,0.3)",
  sky: "#38BDF8",
  skyLight: "#7DD3FC",
  skyBg: "rgba(56,189,248,0.12)",
  skyBorder: "rgba(56,189,248,0.3)",
  amber: "#FBBF24",
  amberBg: "rgba(251,191,36,0.12)",
  amberBorder: "rgba(251,191,36,0.3)",
  lime: "#c3f400",
  limeBg: "rgba(195,244,0,0.15)",
  limeBorder: "rgba(195,244,0,0.3)",
  cyan: "#00daf3",
  cyanBg: "rgba(0,218,243,0.12)",
  cyanBorder: "rgba(0,218,243,0.3)",
} as const;

export const MEAL_COLORS: Record<string, string> = {
  breakfast: ACCENT.coral,
  lunch: ACCENT.lime,
  dinner: ACCENT.sky,
  snack: ACCENT.lime,
  other: "rgba(128,128,128,0.5)",
};

export type ThemeColors = ReturnType<typeof getThemeColors>;
