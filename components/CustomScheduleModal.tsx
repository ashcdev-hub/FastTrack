import React, { useState } from "react";
import { Pressable, View, Text, TextInput, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";

type CustomScheduleModalProps = {
  visible: boolean;
  onSelect: (label: string, fastingHours: number, eatingHours: number) => void;
  onCancel: () => void;
};

export function CustomScheduleModal({ visible, onSelect, onCancel }: CustomScheduleModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [fasting, setFasting] = useState("16");
  const [eating, setEating] = useState("8");

  const handleSet = () => {
    const f = parseInt(fasting) || 16;
    const e = parseInt(eating) || 8;
    onSelect(`${f}:${e}`, f, e);
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

          <View className="flex-row items-center gap-4 mb-8">
            <View className="flex-1">
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-2 text-center">
                Fasting (hours)
              </Text>
              <TextInput
                value={fasting}
                onChangeText={setFasting}
                keyboardType="numeric"
                placeholder="16"
                placeholderTextColor={c.placeholder}
                className="rounded-xl px-4 py-4 text-center text-2xl"
                style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_700Bold" }}
              />
            </View>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_700Bold", fontSize: 24, marginTop: 20 }}>:</Text>
            <View className="flex-1">
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-2 text-center">
                Eating (hours)
              </Text>
              <TextInput
                value={eating}
                onChangeText={setEating}
                keyboardType="numeric"
                placeholder="8"
                placeholderTextColor={c.placeholder}
                className="rounded-xl px-4 py-4 text-center text-2xl"
                style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_700Bold" }}
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <Pressable onPress={onCancel} className="flex-1 py-3.5 rounded-xl items-center" style={{ backgroundColor: c.buttonBg }}>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSet} className="flex-1 py-3.5 rounded-xl items-center" style={{ backgroundColor: ACCENT.lime }}>
              <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold" }}>Apply Schedule</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
