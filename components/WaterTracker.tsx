import React, { useState } from "react";
import { Pressable, View, Text, TextInput } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
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
  const accent = getAccentColors(theme);
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
    <View className="rounded-xl p-5 glass-panel" style={{ borderLeftWidth: 4, borderLeftColor: accent.cyan }}>
      <View className="flex-row justify-between items-center mb-3">
        <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18 }}>Water</Text>
        <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14 }}>
          {displayWater(currentMl, unitPrefs)} / {displayWater(goalMl, unitPrefs)}
        </Text>
      </View>

      <View
        className="h-2.5 rounded-full overflow-hidden mb-2"
        style={{ backgroundColor: c.cardBgAlt }}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: goalMl, now: currentMl, text: `${displayWater(currentMl, unitPrefs)} of ${displayWater(goalMl, unitPrefs)}` }}
      >
        <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accent.cyan }} />
      </View>

      {remainingMl > 0 ? (
        <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 16 }}>
          {displayWater(remainingMl, unitPrefs)} remaining
        </Text>
      ) : (
        <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold", fontSize: 12, marginBottom: 16 }}>
          Goal reached!
        </Text>
      )}

      <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
        BOTTLE SIZE
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {BOTTLE_SIZES_ML.map((ml) => (
          <Pressable
            key={ml}
            onPress={() => onAdd(ml)}
            style={{ backgroundColor: accent.cyanBg, borderWidth: 1, borderColor: accent.cyanBorder }}
            className="rounded-xl px-4 py-2.5"
            accessibilityRole="button"
            accessibilityLabel={`Add ${displayWaterBottle(ml, unitPrefs)} of water`}
          >
            <Text style={{ color: accent.cyan, fontFamily: "Inter_700Bold", fontSize: 14 }}>
              +{displayWaterBottle(ml, unitPrefs)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
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
            style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular" }}
          />
          <Text className="absolute text-sm" style={{ right: 12, top: 12, color: c.textMuted, fontFamily: "Inter_400Regular" }}>
            {unitLabel}
          </Text>
        </View>
        <Pressable
          onPress={handleCustomAdd}
          disabled={!customInput || Number(customInput) <= 0}
          className="rounded-xl px-5 py-3"
          style={{ backgroundColor: customInput && Number(customInput) > 0 ? accent.cyan : c.buttonBg }}
        >
          <Text style={{ fontFamily: "Inter_700Bold", color: customInput && Number(customInput) > 0 ? c.textOnAccent : c.textMuted }}>
            Add
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
