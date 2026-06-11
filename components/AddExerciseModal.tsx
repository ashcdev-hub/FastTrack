import React, { useState } from "react";
import { Pressable, View, Text, TextInput, Modal } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import type { WorkoutGoal } from "@/lib/types";

type AddExerciseModalProps = {
  visible: boolean;
  onClose: () => void;
  onAdd: (exerciseType: string, dailyGoal: number, caloriesPerRep: number) => void;
  disabledGoals: WorkoutGoal[];
  onReinstate: (goalId: string) => void;
};

export function AddExerciseModal({ visible, onClose, onAdd, disabledGoals, onReinstate }: AddExerciseModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [exerciseType, setExerciseType] = useState("");
  const [dailyGoal, setDailyGoal] = useState("100");
  const [caloriesPerRep, setCaloriesPerRep] = useState("0.5");

  const handleAdd = () => {
    if (!exerciseType.trim()) return;
    onAdd(exerciseType.trim().toLowerCase(), parseInt(dailyGoal) || 100, parseFloat(caloriesPerRep) || 0.5);
    setExerciseType(""); setDailyGoal("100"); setCaloriesPerRep("0.5"); onClose();
  };

  const inputStyle = { backgroundColor: c.inputBg, color: c.text, fontFamily: "PlusJakartaSans_500Medium" as const };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: c.overlay }}>
        <View className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
          <View className="flex-row justify-between items-center mb-6">
            <Pressable onPress={onClose}>
              <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_500Medium" }}>Cancel</Text>
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-lg">Add Exercise</Text>
            <View className="w-12" />
          </View>

          {disabledGoals.length > 0 && (
            <View className="mb-5">
              <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_500Medium" }} className="text-xs mb-3">Recently Removed</Text>
              <View className="gap-2">
                {disabledGoals.map((goal) => (
                  <View key={goal.id} className="flex-row items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.cardBorder }}>
                    <View>
                      <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_600SemiBold" }} className="capitalize">{goal.exercise_type}</Text>
                      <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs">
                        {goal.daily_goal} reps/day · {goal.calories_per_rep} cal/rep
                      </Text>
                    </View>
                    <Pressable onPress={() => onReinstate(goal.id)} className="rounded-lg px-3 py-1.5" style={{ backgroundColor: ACCENT.mint }}>
                      <Text style={{ color: c.textOnAccent, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs">Reinstate</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
              <View className="my-4" style={{ height: 1, backgroundColor: c.divider }} />
            </View>
          )}

          <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-2">Exercise Name</Text>
          <TextInput value={exerciseType} onChangeText={setExerciseType} placeholder="e.g., lunges, planks" placeholderTextColor={c.placeholder}
            className="rounded-xl px-4 py-3 mb-4" style={inputStyle} />

          <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-2">Daily Goal (reps)</Text>
          <TextInput value={dailyGoal} onChangeText={setDailyGoal} placeholder="100" placeholderTextColor={c.placeholder} keyboardType="numeric"
            className="rounded-xl px-4 py-3 mb-4" style={inputStyle} />

          <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-2">Calories Per Rep</Text>
          <TextInput value={caloriesPerRep} onChangeText={setCaloriesPerRep} placeholder="0.5" placeholderTextColor={c.placeholder} keyboardType="numeric"
            className="rounded-xl px-4 py-3 mb-4" style={inputStyle} />

          <Pressable onPress={handleAdd} disabled={!exerciseType.trim()} className="rounded-xl py-3"
            style={{ backgroundColor: exerciseType.trim() ? ACCENT.mint : c.buttonBg }}>
            <Text style={{ color: exerciseType.trim() ? c.textOnAccent : c.textMuted, fontFamily: "PlusJakartaSans_700Bold" }} className="text-center">
              Add Exercise
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
