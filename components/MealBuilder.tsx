import React from "react";
import { Pressable, View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, MEAL_COLORS } from "@/lib/theme-colors";
import type { StagedItem } from "@/store/useFoodLogStore";

type MealBuilderProps = {
  items: StagedItem[];
  mealType: string;
  onRemove: (id: string) => void;
  onLog: () => void;
};

export function MealBuilder({ items, mealType, onRemove, onLog }: MealBuilderProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories * item.quantity,
      protein_g: acc.protein_g + item.protein_g * item.quantity,
      carbs_g: acc.carbs_g + item.carbs_g * item.quantity,
      fat_g: acc.fat_g + item.fat_g * item.quantity,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  const color = MEAL_COLORS[mealType] ?? MEAL_COLORS.other;

  if (items.length === 0) {
    return (
      <View className="glass-panel p-6 items-center">
        <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-sm text-center">
          Search for food or add custom items to build your meal
        </Text>
      </View>
    );
  }

  return (
    <View className="glass-panel p-5">
      <View className="flex-row items-center mb-4">
        <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: color }} />
        <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-lg">
          {mealType.charAt(0).toUpperCase() + mealType.slice(1)} ({items.length} {items.length === 1 ? "item" : "items"})
        </Text>
      </View>

      {items.map((item) => (
        <View key={item.id} className="flex-row items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <View className="flex-1">
            <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">{item.name}</Text>
            {item.brand ? (
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs">{item.brand}</Text>
            ) : null}
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mt-0.5">
              {item.quantity > 1 ? `${item.quantity}× ` : ""}
              {item.calories} kcal · P{item.protein_g}g · C{item.carbs_g}g · F{item.fat_g}g
              {item.serving_size ? ` · ${item.serving_size}` : ""}
            </Text>
          </View>
          <Pressable onPress={() => onRemove(item.id)} className="p-2"
            accessibilityRole="button" accessibilityLabel={`Remove ${item.name}`}>
            <MaterialCommunityIcons name="delete-outline" size={18} color={c.textMuted} />
          </Pressable>
        </View>
      ))}

      <View className="mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: c.divider }}>
        <View className="flex-row justify-between mb-3">
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-sm">Total</Text>
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>
            {Math.round(totals.calories)} kcal
          </Text>
        </View>
        <View className="flex-row justify-between mb-4">
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs">
            P: {Math.round(totals.protein_g)}g
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs">
            C: {Math.round(totals.carbs_g)}g
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs">
            F: {Math.round(totals.fat_g)}g
          </Text>
        </View>
        <Pressable
          onPress={onLog}
          className="rounded-xl py-3"
          style={{ backgroundColor: color }}
        >
          <Text style={{ color: color === MEAL_COLORS.breakfast || color === MEAL_COLORS.lunch ? "#161e00" : c.textOnDark, fontFamily: "Inter_700Bold" }} className="text-center">
            Log {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
