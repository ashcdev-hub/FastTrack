import React, { useState } from "react";
import { Pressable, View, Text, TextInput } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";

const PRESETS = [
  { label: "14:10", fasting: 14, eating: 10 },
  { label: "16:8", fasting: 16, eating: 8 },
  { label: "18:6", fasting: 18, eating: 6 },
  { label: "20:4", fasting: 20, eating: 4 },
  { label: "OMAD", fasting: 23, eating: 1 },
];

type ScheduleSelectorProps = {
  selected: string | null;
  onSelect: (schedule: string, fastingHours: number, eatingHours: number) => void;
};

export function ScheduleSelector({ selected, onSelect }: ScheduleSelectorProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const [customMode, setCustomMode] = useState(false);
  const [customFasting, setCustomFasting] = useState("16");
  const [customEating, setCustomEating] = useState("8");

  return (
    <View className="glass-panel p-5 mb-6">
      <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-xs mb-4 tracking-widest">
        FASTING SCHEDULE
      </Text>

      <View className="flex-row gap-3 mb-4">
        {PRESETS.map((p) => {
          const isActive = !customMode && selected === p.label;
          return (
            <Pressable
              key={p.label}
              onPress={() => {
                setCustomMode(false);
                onSelect(p.label, p.fasting, p.eating);
              }}
              className="flex-1 rounded-xl py-4 items-center"
              style={{
                backgroundColor: isActive ? accent.lime : c.cardBgAlt,
                borderWidth: 1,
                borderColor: isActive ? accent.lime : c.cardBorder,
              }}
              accessibilityRole="radio"
              accessibilityLabel={`${p.label} fasting schedule`}
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={{
                  color: isActive ? c.textOnAccent : c.text,
                  fontFamily: "Inter_700Bold",
                }}
                className="text-base"
              >
                {p.label}
              </Text>
              <Text
                style={{
                  color: isActive ? "rgba(12,12,14,0.6)" : c.textMuted,
                  fontFamily: "Inter_400Regular",
                }}
                className="text-[10px] mt-1"
              >
                {p.fasting}h · {p.eating}h
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => {
          const newCustomMode = !customMode;
          setCustomMode(newCustomMode);
          if (newCustomMode) {
            onSelect("", 0, 0);
          }
        }}
        className="rounded-xl items-center"
        style={{
          backgroundColor: customMode ? accent.lime : c.cardBgAlt,
          borderWidth: 1,
          borderColor: customMode ? accent.lime : c.cardBorder,
          paddingVertical: 10,
        }}
      >
        <Text
          style={{
            color: customMode ? c.textOnAccent : c.textSecondary,
            fontFamily: "Inter_700Bold",
          }}
          className="text-base"
        >
          {customMode ? `Custom: ${customFasting}:${customEating}` : "Custom Schedule"}
        </Text>
      </Pressable>

      {customMode && (
        <View className="flex-row items-center gap-3 mt-4">
          <View className="flex-1">
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">
              Fasting
            </Text>
            <TextInput
              value={customFasting}
              onChangeText={(text) => {
                setCustomFasting(text);
                const val = parseInt(text);
                if (!isNaN(val) && val >= 0 && val <= 23) {
                  setCustomEating(String(24 - val));
                }
              }}
              keyboardType="numeric"
              placeholder="16"
              placeholderTextColor={c.placeholder}
              className="rounded-xl px-4 py-3.5 text-center text-xl"
              style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_700Bold" }}
            />
          </View>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_700Bold" }} className="text-xl mt-5">
            :
          </Text>
          <View className="flex-1">
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">
              Eating
            </Text>
            <TextInput
              value={customEating}
              onChangeText={(text) => {
                setCustomEating(text);
                const val = parseInt(text);
                if (!isNaN(val) && val >= 0 && val <= 23) {
                  setCustomFasting(String(24 - val));
                }
              }}
              keyboardType="numeric"
              placeholder="8"
              placeholderTextColor={c.placeholder}
              className="rounded-xl px-4 py-3.5 text-center text-xl"
              style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_700Bold" }}
            />
          </View>
          <Pressable
            onPress={() => {
              const f = parseInt(customFasting) || 16;
              const e = parseInt(customEating) || 8;
              onSelect(`${f}:${e}`, f, e);
            }}
            className="rounded-xl px-6 py-3.5 mt-5"
            style={{ backgroundColor: accent.lime }}
          >
            <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold" }} className="text-sm">
              Set
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
