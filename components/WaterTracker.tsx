import React, { useState } from "react";
import { Pressable, View, Text, TextInput } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";

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
        <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-lg">Water</Text>
        <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">
          {currentMl}ml / {goalMl}ml
        </Text>
      </View>

      <View className="h-2.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: c.cardBgAlt }}>
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: ACCENT.sky }}
        />
      </View>

      {remaining > 0 ? (
        <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-4">
          {remaining}ml remaining
        </Text>
      ) : (
        <Text style={{ color: ACCENT.mint, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs mb-4">
          Goal reached!
        </Text>
      )}

      <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs mb-2 tracking-widest">
        BOTTLE SIZE
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {BOTTLE_SIZES.map((size) => (
          <Pressable
            key={size.value}
            onPress={() => onAdd(size.value)}
            style={{ backgroundColor: ACCENT.skyBg, borderWidth: 1, borderColor: ACCENT.skyBorder }}
            className="rounded-xl px-4 py-2.5"
          >
            <Text style={{ color: ACCENT.sky, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-sm">
              +{size.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs mb-2 tracking-widest">
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
            style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "PlusJakartaSans_500Medium" }}
          />
          <Text
            className="absolute text-sm"
            style={{ right: 12, top: 12, color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }}
          >
            ml
          </Text>
        </View>
        <Pressable
          onPress={handleCustomAdd}
          disabled={!customMl || Number(customMl) <= 0}
          className="rounded-xl px-5 py-3"
          style={{ backgroundColor: customMl && Number(customMl) > 0 ? ACCENT.sky : c.buttonBg }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              color: customMl && Number(customMl) > 0 ? c.textOnDark : c.textMuted,
            }}
          >
            Add
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
