import React, { useState } from "react";
import { Pressable, View, Text, TextInput } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { displayWater, displayWaterBottle, waterUnitLabel, mlToFlOz, flozToMl, DEFAULT_UNITS } from "@/lib/units";
import type { UnitPreferences } from "@/lib/units";

type WaterTrackerProps = {
  currentMl: number;
  goalMl: number;
  onAdd: (amountMl: number) => void;
  unitPrefs?: UnitPreferences;
};

const BOTTLE_SIZES_ML = [250, 330, 500, 750, 1000];

export function WaterTracker({ currentMl, goalMl, onAdd, unitPrefs = DEFAULT_UNITS }: WaterTrackerProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [customInput, setCustomInput] = useState("");

  const pct = goalMl > 0 ? Math.min((currentMl / goalMl) * 100, 100) : 0;
  const remainingMl = Math.max(goalMl - currentMl, 0);
  const unitLabel = waterUnitLabel(unitPrefs);

  const handleCustomAdd = () => {
    const val = parseFloat(customInput);
    if (isNaN(val) || val <= 0) return;
    const ml = unitPrefs.water === "floz" ? flozToMl(val) : val;
    onAdd(ml);
    setCustomInput("");
  };

  return (
    <View className="rounded-2xl p-5" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
      <View className="flex-row justify-between items-center mb-3">
        <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-lg">Water</Text>
        <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">
          {displayWater(currentMl, unitPrefs)} / {displayWater(goalMl, unitPrefs)}
        </Text>
      </View>

      <View className="h-2.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: c.cardBgAlt }}>
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: ACCENT.sky }}
        />
      </View>

      {remainingMl > 0 ? (
        <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-4">
          {displayWater(remainingMl, unitPrefs)} remaining
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
        {BOTTLE_SIZES_ML.map((ml) => (
          <Pressable
            key={ml}
            onPress={() => onAdd(ml)}
            style={{ backgroundColor: ACCENT.skyBg, borderWidth: 1, borderColor: ACCENT.skyBorder }}
            className="rounded-xl px-4 py-2.5"
          >
            <Text style={{ color: ACCENT.sky, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-sm">
              +{displayWaterBottle(ml, unitPrefs)}
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
            value={customInput}
            onChangeText={setCustomInput}
            placeholder={`Enter ${unitLabel}`}
            placeholderTextColor={c.placeholder}
            keyboardType="numeric"
            className="rounded-xl px-4 py-3 pr-10"
            style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "PlusJakartaSans_500Medium" }}
          />
          <Text
            className="absolute text-sm"
            style={{ right: 12, top: 12, color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }}
          >
            {unitLabel}
          </Text>
        </View>
        <Pressable
          onPress={handleCustomAdd}
          disabled={!customInput || Number(customInput) <= 0}
          className="rounded-xl px-5 py-3"
          style={{ backgroundColor: customInput && Number(customInput) > 0 ? ACCENT.sky : c.buttonBg }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              color: customInput && Number(customInput) > 0 ? c.textOnDark : c.textMuted,
            }}
          >
            Add
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
