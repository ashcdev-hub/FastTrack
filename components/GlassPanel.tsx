import React from "react";
import { View, Pressable, type ViewProps, type PressableProps } from "react-native";
import { useThemeStore } from "@/lib/theme-store";

type GlassPanelProps = ViewProps & {
  children: React.ReactNode;
  className?: string;
  as?: "view" | "pressable";
  onPress?: PressableProps["onPress"];
  rounded?: boolean;
};

export function GlassPanel({ children, className = "", style, as = "view", onPress, rounded = true, ...props }: GlassPanelProps) {
  const { theme } = useThemeStore();

  const glassStyle = {
    backgroundColor: theme === "dark" ? "rgba(28, 28, 30, 0.55)" : "rgba(255, 255, 255, 0.65)",
    borderWidth: 1,
    borderColor: theme === "dark" ? "rgba(44, 44, 46, 1)" : "rgba(0, 0, 0, 0.08)",
  };

  if (as === "pressable") {
    return (
      <Pressable
        className={`${rounded ? "rounded-xl " : ""}${className}`}
        style={[glassStyle, style]}
        onPress={onPress}
        {...(props as any)}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      className={`${rounded ? "rounded-xl " : ""}${className}`}
      style={[glassStyle, style]}
      {...props}
    >
      {children}
    </View>
  );
}
