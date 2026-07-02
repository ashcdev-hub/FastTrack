import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, getAccentColors } from "@/lib/theme-colors";
import type { CyclePhase } from "@/lib/types";
import { getPhaseColor, getPhaseIcon } from "@/lib/cycle-phases";

type CyclePhaseBadgeProps = {
  phase: CyclePhase;
  dayOfCycle?: number;
  totalCycleDays?: number;
  size?: "sm" | "md";
};

export function CyclePhaseBadge({ phase, dayOfCycle, totalCycleDays, size = "md" }: CyclePhaseBadgeProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const color = getPhaseColor(phase, theme);
  const icon = getPhaseIcon(phase);
  const isSm = size === "sm";

  return (
    <View className="flex-row items-center gap-2" style={{ marginLeft: -2 }}>
      <View
        className="items-center justify-center"
        style={{
          width: isSm ? 22 : 28,
          height: isSm ? 22 : 28,
          borderRadius: isSm ? 11 : 14,
          backgroundColor: color + "22",
        }}
      >
        <MaterialCommunityIcons name={icon as any} size={isSm ? 12 : 14} color={color} />
      </View>
      <View>
        <View className="flex-row items-center gap-1">
          <Text
            style={{
              color,
              fontFamily: "SpaceGrotesk_700Bold",
              fontSize: isSm ? 10 : 12,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {phase}
          </Text>
          {dayOfCycle !== undefined && (
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: isSm ? 10 : 12 }}>
              Day {dayOfCycle}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
