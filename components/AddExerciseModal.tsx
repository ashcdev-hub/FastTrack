import React, { useState } from "react";
import { Pressable, View, Text, TextInput, Modal } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";

type AddExerciseModalProps = {
  visible: boolean;
  onClose: () => void;
  onAdd: (exerciseType: string, dailyGoal: number, caloriesPerRep: number) => void;
};

export function AddExerciseModal({
  visible,
  onClose,
  onAdd,
}: AddExerciseModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [exerciseType, setExerciseType] = useState("");
  const [dailyGoal, setDailyGoal] = useState("100");
  const [caloriesPerRep, setCaloriesPerRep] = useState("0.5");

  const handleAdd = () => {
    if (!exerciseType.trim()) return;
    const goal = parseInt(dailyGoal) || 100;
    const calPerRep = parseFloat(caloriesPerRep) || 0.5;
    onAdd(exerciseType.trim().toLowerCase(), goal, calPerRep);
    setExerciseType("");
    setDailyGoal("100");
    setCaloriesPerRep("0.5");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View
          className="rounded-t-3xl p-6"
          style={{ backgroundColor: theme === "dark" ? "#1E293B" : "#FFFFFF" }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Pressable onPress={onClose}>
              <Text style={{ color: c.textSecondary }} className="text-base">
                Cancel
              </Text>
              </Pressable>
            <Text style={{ color: c.text }} className="text-lg font-bold">
              Add Exercise
            </Text>
            <View className="w-12" />
          </View>

          {/* Exercise Name */}
          <Text style={{ color: c.textSecondary }} className="text-xs mb-2">
            Exercise Name
          </Text>
          <TextInput
            value={exerciseType}
            onChangeText={setExerciseType}
            placeholder="e.g., lunges, planks"
            placeholderTextColor={c.placeholder}
            className="rounded-xl px-4 py-3 mb-4"
            style={{ backgroundColor: c.inputBg, color: c.text }}
          />

          {/* Daily Goal */}
          <Text style={{ color: c.textSecondary }} className="text-xs mb-2">
            Daily Goal (reps)
          </Text>
          <TextInput
            value={dailyGoal}
            onChangeText={setDailyGoal}
            placeholder="100"
            placeholderTextColor={c.placeholder}
            keyboardType="numeric"
            className="rounded-xl px-4 py-3 mb-4"
            style={{ backgroundColor: c.inputBg, color: c.text }}
          />

          {/* Calories Per Rep */}
          <Text style={{ color: c.textSecondary }} className="text-xs mb-2">
            Calories Per Rep
          </Text>
          <TextInput
            value={caloriesPerRep}
            onChangeText={setCaloriesPerRep}
            placeholder="0.5"
            placeholderTextColor={c.placeholder}
            keyboardType="numeric"
            className="rounded-xl px-4 py-3 mb-4"
            style={{ backgroundColor: c.inputBg, color: c.text }}
          />

          {/* Add Button */}
          <Pressable
            onPress={handleAdd}
            disabled={!exerciseType.trim()}
            className="rounded-xl py-3"
            style={{
              backgroundColor: exerciseType.trim() ? "#3B82F6" : c.buttonBg,
            }}
          >
            <Text
              className="text-center font-bold"
              style={{
                color: exerciseType.trim() ? "#FFFFFF" : c.textMuted,
              }}
            >
              Add Exercise
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
