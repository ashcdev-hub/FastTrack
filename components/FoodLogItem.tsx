import React from "react";
import { Pressable, View, Text } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";
import type { FoodLogEntry } from "@/lib/types";

type FoodLogItemProps = {
  entry: FoodLogEntry;
  onDelete?: (id: string) => void;
};

const mealColors: Record<string, string> = {
  breakfast: "#F59E0B",
  lunch: "#10B981",
  dinner: "#3B82F6",
  snack: "#8B5CF6",
  other: "#6B7280",
};

export function FoodLogItem({ entry, onDelete }: FoodLogItemProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const color = mealColors[entry.meal_type] ?? "#6B7280";

  return (
    <View className="rounded-xl p-4 mb-3 flex-row items-center" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
      <View
        className="w-1 h-10 rounded-full mr-3"
        style={{ backgroundColor: color }}
      />
      <View className="flex-1">
        <Text style={{ color: c.text }} className="font-medium text-base">{entry.name}</Text>
        <Text style={{ color: c.textMuted }} className="text-xs mt-0.5">
          {entry.meal_type.charAt(0).toUpperCase() + entry.meal_type.slice(1)}
          {entry.brand ? ` · ${entry.brand}` : ""}
        </Text>
      </View>
      <View className="items-end">
        <Text style={{ color: c.text }} className="font-semibold">{entry.calories} kcal</Text>
        <Text style={{ color: c.textMuted }} className="text-xs">
          P{entry.protein_g ?? 0} / C{entry.carbs_g ?? 0} / F{entry.fat_g ?? 0}
        </Text>
      </View>
      {onDelete && (
        <Pressable
          onPress={() => onDelete(entry.id)}
          className="ml-3 p-2"
        >
          <Text className="text-red-400 text-lg">×</Text>
        </Pressable>
      )}
    </View>
  );
}
