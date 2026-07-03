import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeStore } from "@/lib/theme-store";
import { getAccentColors, getThemeColors } from "@/lib/theme-colors";

export function AmbientBackground() {
  const { theme } = useThemeStore();
  const accent = getAccentColors(theme);
  const c = getThemeColors(theme);

  return (
    <LinearGradient
      colors={[
        accent.limeBg,
        "transparent",
        accent.cyanBg,
        "transparent",
        accent.roseBg,
        c.bg,
      ]}
      locations={[0, 0.18, 0.36, 0.54, 0.72, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}
