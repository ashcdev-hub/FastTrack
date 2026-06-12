import React, { useState } from "react";
import { Pressable, View, Text, Modal } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import type { WorkoutGoal } from "@/lib/types";

type LogSetModalProps = {
  visible: boolean;
  goal: WorkoutGoal | null;
  weightKg: number | null;
  onClose: () => void;
  onLog: (reps: number, sets: number) => void;
};

export function LogSetModal({ visible, goal, weightKg, onClose, onLog }: LogSetModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [reps, setReps] = useState(10);
  const [sets, setSets] = useState(1);

  if (!goal) return null;

  const caloriesBurned = reps * sets * goal.calories_per_rep * ((weightKg ?? 70) / 70);

  const handleLog = () => { onLog(reps, sets); setReps(10); setSets(1); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: c.overlay }}>
        <View className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
          <View className="flex-row justify-between items-center mb-6">
            <Pressable onPress={onClose}>
              <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_500Medium" }}>Cancel</Text>
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-lg capitalize">
              Log {goal.exercise_type}
            </Text>
            <View className="w-12" />
          </View>

          {/* Reps Stepper */}
          <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_500Medium" }} className="text-xs mb-2">Reps</Text>
          <View className="flex-row items-center justify-center gap-4 mb-2">
            <Pressable onPress={() => setReps((r) => Math.max(5, r - 5))} className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: c.buttonBg }}
              accessibilityRole="button" accessibilityLabel="Decrease reps by 5">
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-xl">−</Text>
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-3xl w-24 text-center">{reps}</Text>
            <Pressable onPress={() => setReps((r) => r + 5)} className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: c.buttonBg }}
              accessibilityRole="button" accessibilityLabel="Increase reps by 5">
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-xl">+</Text>
            </Pressable>
          </View>
          <View className="flex-row gap-2 mb-5">
            {[5, 10, 15, 20, 25].map((preset) => (
              <Pressable key={preset} onPress={() => setReps(preset)} className="flex-1 py-2 rounded-lg items-center"
                style={{ backgroundColor: reps === preset ? ACCENT.mint : c.buttonBg }}>
                <Text className="text-xs" style={{ color: reps === preset ? c.textOnAccent : c.textSecondary, fontFamily: "PlusJakartaSans_600SemiBold" }}>
                  {preset}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Sets Stepper */}
          <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_500Medium" }} className="text-xs mb-2">Sets</Text>
          <View className="flex-row items-center justify-center gap-4 mb-2">
            <Pressable onPress={() => setSets((s) => Math.max(1, s - 1))} className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: c.buttonBg }}
              accessibilityRole="button" accessibilityLabel="Decrease sets by 1">
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-xl">−</Text>
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-3xl w-24 text-center">{sets}</Text>
            <Pressable onPress={() => setSets((s) => s + 1)} className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: c.buttonBg }}
              accessibilityRole="button" accessibilityLabel="Increase sets by 1">
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-xl">+</Text>
            </Pressable>
          </View>
          <View className="flex-row gap-2 mb-5">
            {[1, 2, 3, 4, 5].map((preset) => (
              <Pressable key={preset} onPress={() => setSets(preset)} className="flex-1 py-2 rounded-lg items-center"
                style={{ backgroundColor: sets === preset ? ACCENT.mint : c.buttonBg }}>
                <Text className="text-xs" style={{ color: sets === preset ? c.textOnAccent : c.textSecondary, fontFamily: "PlusJakartaSans_600SemiBold" }}>
                  {preset}
                </Text>
              </Pressable>
            ))}
          </View>

          {reps > 0 && (
            <View className="rounded-xl p-3 mb-4" style={{ backgroundColor: ACCENT.mintBg }}>
              <Text style={{ color: ACCENT.mint, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-sm">
                Estimated calories burned: {Math.round(caloriesBurned)}
              </Text>
            </View>
          )}

          <Pressable onPress={handleLog} className="rounded-xl py-3" style={{ backgroundColor: ACCENT.mint }}>
            <Text style={{ color: c.textOnAccent, fontFamily: "PlusJakartaSans_700Bold" }} className="text-center">Log Set</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
