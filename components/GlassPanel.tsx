import React from "react";
import { View, ViewProps } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";

type GlassPanelProps = ViewProps & {
  children: React.ReactNode;
  className?: string;
};

export function GlassPanel({ children, className = "", style, ...props }: GlassPanelProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  return (
    <View
      className={`rounded-xl ${className}`}
      style={[
        {
          backgroundColor: "rgba(28, 28, 30, 0.8)",
          borderWidth: 1,
          borderColor: "rgba(44, 44, 46, 1)",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
