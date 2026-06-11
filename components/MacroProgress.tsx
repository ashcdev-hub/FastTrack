import React from "react";
import { View, Text } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";

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

  return (
    <View className="mb-4">
      <View className="flex-row justify-between mb-1">
        <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">{label}</Text>
        <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-sm">
          {Math.round(current)}{unit} / {goal}{unit}
        </Text>
      </View>
      <View className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: c.cardBgAlt }}>
        <View
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

type MacroProgressProps = {
  calories: { current: number; goal: number };
  protein: { current: number; goal: number };
  carbs: { current: number; goal: number };
  fat: { current: number; goal: number };
};

export function MacroProgress({
  calories,
  protein,
  carbs,
  fat,
}: MacroProgressProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  return (
    <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
      <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-lg mb-4">Today&apos;s Progress</Text>
      <MacroBar label="Calories" current={calories.current} goal={calories.goal} unit=" kcal" color={ACCENT.coral} />
      <MacroBar label="Protein" current={protein.current} goal={protein.goal} unit="g" color={ACCENT.mint} />
      <MacroBar label="Carbs" current={carbs.current} goal={carbs.goal} unit="g" color={ACCENT.sky} />
      <MacroBar label="Fat" current={fat.current} goal={fat.goal} unit="g" color={ACCENT.rose} />
    </View>
  );
}
