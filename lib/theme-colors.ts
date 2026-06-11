type Theme = "dark" | "light";

export function getThemeColors(theme: Theme) {
  return {
    bg: theme === "dark" ? "#0C0C0E" : "#F6F4EF",
    surface: theme === "dark" ? "#161618" : "#FFFFFF",
    elevated: theme === "dark" ? "#1E1E21" : "#F0EDE8",
    text: theme === "dark" ? "#F0EDE8" : "#1A1816",
    textSecondary: theme === "dark" ? "rgba(240,237,232,0.55)" : "rgba(26,24,22,0.5)",
    textMuted: theme === "dark" ? "rgba(240,237,232,0.35)" : "rgba(26,24,22,0.3)",
    textFaint: theme === "dark" ? "rgba(240,237,232,0.2)" : "rgba(26,24,22,0.15)",
    cardBg: theme === "dark" ? "#161618" : "#FFFFFF",
    cardBgAlt: theme === "dark" ? "#1E1E21" : "#F0EDE8",
    cardBorder: theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
    inputBg: theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
    inputBorder: theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
    buttonBg: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
    divider: theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
    tabBarBg: theme === "dark" ? "#0D0D0F" : "#FAFAF7",
    tabBarBorder: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    tabBarInactive: theme === "dark" ? "rgba(240,237,232,0.3)" : "rgba(26,24,22,0.35)",
    placeholder: theme === "dark" ? "rgba(240,237,232,0.35)" : "rgba(26,24,22,0.35)",
  };
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
} as const;

export type ThemeColors = ReturnType<typeof getThemeColors>;
