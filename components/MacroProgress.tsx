import React from "react";
import { View, Text } from "react-native";
import Animated from "react-native-reanimated";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import { useAnimatedBar } from "@/hooks/useAnimatedBar";

type MacroBarProps = {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
};

function MacroBar({ label, current, goal, unit, color }: MacroBarProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const barStyle = useAnimatedBar(pct);

  return (
    <View className="mb-4">
      <View className="flex-row justify-between mb-1">
        <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}>{label}</Text>
        <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14 }}>
          {Math.round(current)}{unit} / {goal}{unit}
        </Text>
      </View>
      <View className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: c.cardBgAlt }}>
        <Animated.View className="h-full rounded-full" style={[{ backgroundColor: color }, barStyle]} />
      </View>
    </View>
  );
}