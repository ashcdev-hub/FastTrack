import React, { useState } from "react";
import { Pressable, View, Text, TextInput, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";

type EditGoalModalProps = {
  visible: boolean;
  currentGoal: number;
  exerciseName: string;
  onSave: (newGoal: number) => void;
  onCancel: () => void;
};

export function EditGoalModal({ visible, currentGoal, exerciseName, onSave, onCancel }: EditGoalModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const [goalInput, setGoalInput] = useState(String(currentGoal));
  const [customMode, setCustomMode] = useState(false);

  const handleSave = () => {
    const newGoal = parseInt(goalInput);
    if (!isNaN(newGoal) && newGoal > 0) {
      onSave(newGoal);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={onCancel}>
        <Pressable className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }} onStartShouldSetResponder={() => true}>
          <View className="flex-row justify-between items-center mb-6">
            <Pressable onPress={onCancel}>
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }}>Cancel</Text>
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-lg capitalize">
              Edit {exerciseName} Goal
            </Text>
            <View className="w-12" />
          </View>

          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-4 text-center">
            Daily Goal (reps/day)
          </Text>

          <View className="flex-row items-center justify-center gap-4 mb-5">
            <Pressable
              onPress={() => { const v = parseInt(goalInput); if (!isNaN(v) && v > 10) setGoalInput(String(v - 10)); }}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: c.buttonBg }}
            >
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-xl">−</Text>
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 36, width: 100, textAlign: "center" }}>
              {goalInput}
            </Text>
            <Pressable
              onPress={() => { const v = parseInt(goalInput); if (!isNaN(v)) setGoalInput(String(v + 10)); }}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: c.buttonBg }}
            >
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-xl">+</Text>
            </Pressable>
          </View>

          <View className="flex-row gap-2 mb-5">
            {[50, 100, 150, 200, 250].map((preset) => {
              const isActive = !customMode && parseInt(goalInput) === preset;
              return (
                <Pressable
                  key={preset}
                  onPress={() => { setGoalInput(String(preset)); setCustomMode(false); }}
                  className="flex-1 py-2.5 rounded-lg items-center"
                  style={{ backgroundColor: isActive ? accent.lime : c.buttonBg }}
                >
                  <Text style={{ color: isActive ? c.textOnAccent : c.textMuted, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 13 }}>{preset}</Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setCustomMode(true)}
              className="flex-1 py-2.5 rounded-lg items-center"
              style={{ backgroundColor: customMode ? accent.lime : c.buttonBg }}
            >
              <Text style={{ color: customMode ? c.textOnAccent : c.textMuted, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 13 }}>Custom</Text>
            </Pressable>
          </View>

          {customMode && (
            <TextInput
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder="Enter goal"
              placeholderTextColor={c.placeholder}
              keyboardType="numeric"
              className="rounded-xl px-4 py-3 mb-5"
              style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular" }}
            />
          )}

          <View className="flex-row gap-3">
            <Pressable onPress={onCancel} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: c.buttonBg }}>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: accent.lime }}>
              <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold" }}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
