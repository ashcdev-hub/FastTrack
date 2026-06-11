type Theme = "dark" | "light";

export function getThemeColors(theme: Theme) {
  return {
    bg: theme === "dark" ? "#0F172A" : "#F9FAFB",
    text: theme === "dark" ? "#FFFFFF" : "#111827",
    textSecondary: theme === "dark" ? "rgba(255,255,255,0.6)" : "#6B7280",
    textMuted: theme === "dark" ? "rgba(255,255,255,0.4)" : "#9CA3AF",
    textFaint: theme === "dark" ? "rgba(255,255,255,0.3)" : "#D1D5DB",
    cardBg: theme === "dark" ? "rgba(255,255,255,0.05)" : "#FFFFFF",
    cardBgAlt: theme === "dark" ? "rgba(255,255,255,0.08)" : "#F3F4F6",
    cardBorder: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB",
    inputBg: theme === "dark" ? "rgba(255,255,255,0.1)" : "#F3F4F6",
    inputBorder: theme === "dark" ? "rgba(255,255,255,0.15)" : "#D1D5DB",
    buttonBg: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB",
    divider: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB",
    tabBarBg: theme === "dark" ? "#0F172A" : "#FFFFFF",
    tabBarBorder: theme === "dark" ? "#1E293B" : "#E5E7EB",
    tabBarInactive: theme === "dark" ? "#64748B" : "#9CA3AF",
    placeholder: theme === "dark" ? "rgba(255,255,255,0.4)" : "#9CA3AF",
  };
}

export type ThemeColors = ReturnType<typeof getThemeColors>;
