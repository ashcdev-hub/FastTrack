import React, { useState, useEffect } from "react";
import { Pressable, View, Text, TextInput, Modal, ScrollView } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { WorkoutIcon } from "@/components/WorkoutIcon";
import { ICON_DEFS, getIconKeyForExercise } from "@/lib/exercise-icons";
import type { WorkoutGoal } from "@/lib/types";

type AddExerciseModalProps = {
  visible: boolean;
  onClose: () => void;
  onAdd: (exerciseType: string, dailyGoal: number, caloriesPerRep: number, iconName?: string) => void;
  disabledGoals: WorkoutGoal[];
  onReinstate: (goalId: string) => void;
};

export function AddExerciseModal({ visible, onClose, onAdd, disabledGoals, onReinstate }: AddExerciseModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [exerciseType, setExerciseType] = useState("");
  const [dailyGoal, setDailyGoal] = useState("100");
  const [caloriesPerRep, setCaloriesPerRep] = useState("0.5");
  const [selectedIcon, setSelectedIcon] = useState("dumbbell");

  useEffect(() => {
    if (exerciseType.trim()) {
      setSelectedIcon(getIconKeyForExercise(exerciseType));
    }
  }, [exerciseType]);

  const iconColor = (anchor: string) => (selectedIcon === anchor ? ACCENT.lime : c.textMuted);
  const iconBg = (anchor: string) => (selectedIcon === anchor ? "rgba(195,244,0,0.12)" : "transparent");
  const iconBorder = (anchor: string) => (selectedIcon === anchor ? ACCENT.limeBorder : "rgba(255,255,255,0.06)");

  const handleAdd = () => {
    if (!exerciseType.trim()) return;
    onAdd(
      exerciseType.trim().toLowerCase(),
      parseInt(dailyGoal) || 100,
      parseFloat(caloriesPerRep) || 0.5,
      selectedIcon,
    );
    setExerciseType(""); setDailyGoal("100"); setCaloriesPerRep("0.5"); setSelectedIcon("dumbbell"); onClose();
  };

  const inputStyle = { backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular" as const };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={onClose}>
        <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
          <View className="flex-row justify-between items-center mb-6">
            <Pressable onPress={onClose}>
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }}>Cancel</Text>
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-lg">Add Exercise</Text>
            <View className="w-12" />
          </View>

          {disabledGoals.length > 0 && (
            <View className="mb-5">
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-3">Recently Removed</Text>
              <View className="gap-2">
                {disabledGoals.map((goal) => {
                  const gIconKey = goal.icon_name ?? getIconKeyForExercise(goal.exercise_type);
                  return (
                    <View key={goal.id} className="flex-row items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.cardBorder }}>
                      <View className="flex-row items-center gap-3">
                        <WorkoutIcon name={gIconKey} size={24} color={c.textMuted} />
                        <View>
                          <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold" }} className="capitalize">{goal.exercise_type}</Text>
                          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs">
                            {goal.daily_goal} reps/day · {goal.calories_per_rep} cal/rep
                          </Text>
                        </View>
                      </View>
                      <Pressable onPress={() => onReinstate(goal.id)} className="rounded-lg px-3 py-1.5" style={{ backgroundColor: ACCENT.lime }}>
                        <Text style={{ color: c.textOnAccent, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-xs">Reinstate</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
              <View className="my-4" style={{ height: 1, backgroundColor: c.divider }} />
            </View>
          )}

          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-2">Exercise Name</Text>
          <TextInput value={exerciseType} onChangeText={setExerciseType} placeholder="e.g., lunges, planks" placeholderTextColor={c.placeholder}
            className="rounded-xl px-4 py-3 mb-4" style={inputStyle} />

          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-2">Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 10 }}>
            {ICON_DEFS.map((def) => (
              <Pressable
                key={def.key}
                onPress={() => setSelectedIcon(def.key)}
                className="items-center justify-center rounded-xl w-14 h-14"
                style={{ backgroundColor: iconBg(def.key), borderWidth: 1.5, borderColor: iconBorder(def.key) }}
              >
                <WorkoutIcon name={def.key} size={26} color={iconColor(def.key)} />
                <Text style={{ color: iconColor(def.key), fontFamily: "Inter_400Regular", fontSize: 8, marginTop: 1 }} numberOfLines={1}>
                  {def.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-2">Daily Goal (reps)</Text>
          <TextInput value={dailyGoal} onChangeText={setDailyGoal} placeholder="100" placeholderTextColor={c.placeholder} keyboardType="numeric"
            className="rounded-xl px-4 py-3 mb-4" style={inputStyle} />

          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-2">Calories Per Rep</Text>
          <TextInput value={caloriesPerRep} onChangeText={setCaloriesPerRep} placeholder="0.5" placeholderTextColor={c.placeholder} keyboardType="numeric"
            className="rounded-xl px-4 py-3 mb-4" style={inputStyle} />

          <Pressable onPress={handleAdd} disabled={!exerciseType.trim()} className="rounded-xl py-3"
            style={{ backgroundColor: exerciseType.trim() ? ACCENT.lime : c.buttonBg }}>
            <Text style={{ color: exerciseType.trim() ? c.textOnAccent : c.textMuted, fontFamily: "Inter_700Bold" }} className="text-center">
              Add Exercise
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
