import React, { useState } from "react";
import { Pressable, View, Text, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";

const PRESETS = [
  { label: "14:10", fasting: 14, eating: 10 },
  { label: "16:8", fasting: 16, eating: 8 },
  { label: "18:6", fasting: 18, eating: 6 },
  { label: "20:4", fasting: 20, eating: 4 },
];

type CustomScheduleModalProps = {
  visible: boolean;
  onSelect: (label: string, fastingHours: number, eatingHours: number) => void;
  onCancel: () => void;
};

export function CustomScheduleModal({ visible, onSelect, onCancel }: CustomScheduleModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const [fasting, setFasting] = useState(16);
  const [eating, setEating] = useState(8);

  const handleSet = () => {
    onSelect(`${fasting}:${eating}`, fasting, eating);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={onCancel}>
        <Pressable className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }} onStartShouldSetResponder={() => true}>
          <View className="flex-row justify-between items-center mb-6">
            <Pressable onPress={onCancel}>
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }}>Cancel</Text>
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-lg">
              Custom Schedule
            </Text>
            <View className="w-12" />
          </View>

          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-sm mb-6 text-center">
            Set your own fasting and eating hours
          </Text>

          {/* Stepper Controls */}
          <View className="flex-row items-center gap-4 mb-8">
            <View className="flex-1">
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-3 text-center">
                Fasting (hours)
              </Text>
              <View className="flex-row items-center justify-between rounded-xl px-3 py-2" style={{ backgroundColor: c.inputBg }}>
                <Pressable
                  onPress={() => setFasting(Math.max(1, fasting - 1))}
                  className="w-10 h-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: c.buttonBg }}
                >
                  <MaterialCommunityIcons name="minus" size={20} color={c.text} />
                </Pressable>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 28, minWidth: 60, textAlign: "center" }}>
                  {fasting}
                </Text>
                <Pressable
                  onPress={() => setFasting(Math.min(48, fasting + 1))}
                  className="w-10 h-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: c.buttonBg }}
                >
                  <MaterialCommunityIcons name="plus" size={20} color={c.text} />
                </Pressable>
              </View>
            </View>

            <Text style={{ color: c.textMuted, fontFamily: "Inter_700Bold", fontSize: 24, marginTop: 20 }}>:</Text>

            <View className="flex-1">
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-3 text-center">
                Eating (hours)
              </Text>
              <View className="flex-row items-center justify-between rounded-xl px-3 py-2" style={{ backgroundColor: c.inputBg }}>
                <Pressable
                  onPress={() => setEating(Math.max(1, eating - 1))}
                  className="w-10 h-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: c.buttonBg }}
                >
                  <MaterialCommunityIcons name="minus" size={20} color={c.text} />
                </Pressable>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 28, minWidth: 60, textAlign: "center" }}>
                  {eating}
                </Text>
                <Pressable
                  onPress={() => setEating(Math.min(24, eating + 1))}
                  className="w-10 h-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: c.buttonBg }}
                >
                  <MaterialCommunityIcons name="plus" size={20} color={c.text} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Preset Chips */}
          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
            Presets
          </Text>
          <View className="flex-row gap-2 mb-6">
            {PRESETS.map((p) => {
              const isActive = fasting === p.fasting && eating === p.eating;
              return (
                <Pressable
                  key={p.label}
                  onPress={() => { setFasting(p.fasting); setEating(p.eating); }}
                  className="flex-1 py-2.5 rounded-lg items-center"
                  style={{ backgroundColor: isActive ? accent.lime : c.buttonBg }}
                >
                  <Text style={{ color: isActive ? c.textOnAccent : c.text, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="flex-row gap-3">
            <Pressable onPress={onCancel} className="flex-1 py-3.5 rounded-xl items-center" style={{ backgroundColor: c.buttonBg }}>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSet} className="flex-1 py-3.5 rounded-xl items-center" style={{ backgroundColor: accent.lime }}>
              <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold" }}>Apply Schedule</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
