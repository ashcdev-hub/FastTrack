import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, MEAL_COLORS } from "@/lib/theme-colors";

type FoodLogEntry = {
  id: string;
  name: string;
  brand?: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  serving_size?: string | null;
  quantity?: number;
  meal_type: string;
};

type FoodLogItemProps = {
  entry: FoodLogEntry;
  onDelete?: (id: string) => void;
};

export function FoodLogItem({ entry, onDelete }: FoodLogItemProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const color = MEAL_COLORS[entry.meal_type] ?? MEAL_COLORS.other;

  return (
    <View className="glass-panel p-4 mb-2 flex-row items-center">
      <View
        style={{
          width: 4,
          height: 40,
          borderRadius: 4,
          marginRight: 12,
          backgroundColor: color,
        }}
      />
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">
            {entry.name}
          </Text>
          {entry.brand ? (
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs ml-2">
              {entry.brand}
            </Text>
          ) : null}
        </View>
        <View className="flex-row items-center mt-1">
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs">
            {entry.calories ?? 0} kcal · P{entry.protein_g ?? 0}g · C{entry.carbs_g ?? 0}g · F{entry.fat_g ?? 0}g
          </Text>
          {entry.serving_size && entry.quantity && entry.quantity > 1 ? (
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs ml-2">
              ×{entry.quantity}
            </Text>
          ) : null}
        </View>
      </View>
      {onDelete && (
        <Pressable onPress={() => onDelete(entry.id)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ padding: 8 }}
          accessibilityRole="button" accessibilityLabel={`Delete ${entry.name}`}>
          <MaterialCommunityIcons name="delete-outline" size={18} color={c.textMuted} />
        </Pressable>
      )}
    </View>
  );
}
