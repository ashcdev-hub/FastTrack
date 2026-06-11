import React, { useState } from "react";
import { Pressable, View, Text, TextInput } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";

type WaterTrackerProps = {
  currentMl: number;
  goalMl: number;
  onAdd: (amount: number) => void;
};

const BOTTLE_SIZES = [
  { label: "250ml", value: 250 },
  { label: "330ml", value: 330 },
  { label: "500ml", value: 500 },
  { label: "750ml", value: 750 },
  { label: "1L", value: 1000 },
];

export function WaterTracker({ currentMl, goalMl, onAdd }: WaterTrackerProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [customMl, setCustomMl] = useState("");

  const pct = goalMl > 0 ? Math.min((currentMl / goalMl) * 100, 100) : 0;
  const remaining = Math.max(goalMl - currentMl, 0);

  const handleCustomAdd = () => {
    const amount = Number(customMl);
    if (amount > 0) {
      onAdd(amount);
      setCustomMl("");
    }
  };

  return (
    <View className="rounded-2xl p-5" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
      <View className="flex-row justify-between items-center mb-3">
        <Text style={{ color: c.text }} className="text-lg font-bold">Water</Text>
        <Text style={{ color: c.textSecondary }} className="text-sm">
          {currentMl}ml / {goalMl}ml
        </Text>
      </View>

      <View className="h-3 rounded-full overflow-hidden mb-2" style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}>
        <View
          className="h-full rounded-full bg-cyan-500"
          style={{ width: `${pct}%` }}
        />
      </View>

      {remaining > 0 ? (
        <Text style={{ color: c.textMuted }} className="text-xs mb-4">
          {remaining}ml remaining
        </Text>
      ) : (
        <Text className="text-emerald-400 text-xs font-semibold mb-4">
          Goal reached!
        </Text>
      )}

      <Text style={{ color: c.textSecondary }} className="text-xs font-bold mb-2 tracking-wider">
        BOTTLE SIZE
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {BOTTLE_SIZES.map((size) => (
          <Pressable
            key={size.value}
            onPress={() => onAdd(size.value)}
            className="bg-cyan-500/20 border border-cyan-500/40 rounded-xl px-4 py-2.5"
          >
            <Text className="text-cyan-400 font-semibold text-sm">
              +{size.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: c.textSecondary }} className="text-xs font-bold mb-2 tracking-wider">
        CUSTOM AMOUNT
      </Text>
      <View className="flex-row gap-2">
        <View className="flex-1 relative">
          <TextInput
            value={customMl}
            onChangeText={setCustomMl}
            placeholder="Enter ml"
            placeholderTextColor={c.placeholder}
            keyboardType="numeric"
            className="rounded-xl px-4 py-3 pr-10"
            style={{ backgroundColor: c.inputBg, color: c.text }}
          />
          <Text
            className="absolute text-sm"
            style={{ right: 12, top: 12, color: c.textMuted }}
          >
            ml
          </Text>
        </View>
        <Pressable
          onPress={handleCustomAdd}
          disabled={!customMl || Number(customMl) <= 0}
          className="rounded-xl px-5 py-3"
          style={{ backgroundColor: customMl && Number(customMl) > 0 ? "#06B6D4" : c.buttonBg }}
        >
          <Text
            className="font-semibold"
            style={{ color: customMl && Number(customMl) > 0 ? "#FFFFFF" : c.textMuted }}
          >
            Add
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
