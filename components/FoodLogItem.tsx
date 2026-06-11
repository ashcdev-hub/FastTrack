import React from "react";
import { View, Text, Pressable } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Delete02Icon from "@hugeicons/core-free-icons/dist/esm/Delete02Icon";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";

const MEAL_COLORS: Record<string, string> = {
  breakfast: ACCENT.coral,
  lunch: ACCENT.mint,
  dinner: ACCENT.sky,
  snack: "rgba(255,107,82,0.7)",
  other: "rgba(240,237,232,0.35)",
};

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
    <View
      className="rounded-xl p-4 mb-2 flex-row items-center"
      style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}
    >
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
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">
            {entry.name}
          </Text>
          {entry.brand ? (
            <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs ml-2">
              {entry.brand}
            </Text>
          ) : null}
        </View>
        <View className="flex-row items-center mt-1">
          <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs">
            {entry.calories ?? 0} kcal · P{entry.protein_g ?? 0}g · C{entry.carbs_g ?? 0}g · F{entry.fat_g ?? 0}g
          </Text>
          {entry.serving_size && entry.quantity && entry.quantity > 1 ? (
            <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs ml-2">
              ×{entry.quantity}
            </Text>
          ) : null}
        </View>
      </View>
      {onDelete && (
        <Pressable onPress={() => onDelete(entry.id)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ padding: 8 }}>
          <HugeiconsIcon icon={Delete02Icon} size={18} color={c.textMuted} strokeWidth={1.5} />
        </Pressable>
      )}
    </View>
  );
}
