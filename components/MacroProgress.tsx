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
        <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}>{label}</Text>
        <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14 }}>
          {Math.round(current)}{unit} / {goal}{unit}
        </Text>
      </View>
      <View className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: c.cardBgAlt }}>
        <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
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

export function MacroProgress({ calories, protein, carbs, fat }: MacroProgressProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  return (
    <View className="rounded-xl p-5 mb-6 glass-panel">
      <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 16 }}>Today&apos;s Progress</Text>
      <MacroBar label="Calories" current={calories.current} goal={calories.goal} unit=" kcal" color={ACCENT.lime} />
      <MacroBar label="Protein" current={protein.current} goal={protein.goal} unit="g" color={ACCENT.lime} />
      <MacroBar label="Carbs" current={carbs.current} goal={carbs.goal} unit="g" color={ACCENT.cyan} />
      <MacroBar label="Fat" current={fat.current} goal={fat.goal} unit="g" color={ACCENT.coral} />
    </View>
  );
}
