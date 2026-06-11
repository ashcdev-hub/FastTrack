import React, { useState } from "react";
import { Pressable, View, Text, Modal } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";
import type { WorkoutGoal } from "@/lib/types";

type LogSetModalProps = {
  visible: boolean;
  goal: WorkoutGoal | null;
  weightKg: number | null;
  onClose: () => void;
  onLog: (reps: number, sets: number) => void;
};

export function LogSetModal({
  visible,
  goal,
  weightKg,
  onClose,
  onLog,
}: LogSetModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [reps, setReps] = useState(10);
  const [sets, setSets] = useState(1);

  if (!goal) return null;

  const caloriesBurned =
    reps * sets * goal.calories_per_rep * ((weightKg ?? 70) / 70);

  const handleLog = () => {
    onLog(reps, sets);
    setReps(10);
    setSets(1);
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
            <Text style={{ color: c.text }} className="text-lg font-bold capitalize">
              Log {goal.exercise_type}
            </Text>
            <View className="w-12" />
          </View>

          {/* Reps Stepper */}
          <Text style={{ color: c.textSecondary }} className="text-xs font-medium mb-2">
            Reps
          </Text>
          <View className="flex-row items-center justify-center gap-4 mb-2">
            <Pressable
              onPress={() => setReps((r) => Math.max(5, r - 5))}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}
            >
              <Text style={{ color: c.text }} className="text-xl font-bold">−</Text>
            </Pressable>
            <Text style={{ color: c.text }} className="text-3xl font-bold w-24 text-center">
              {reps}
            </Text>
            <Pressable
              onPress={() => setReps((r) => r + 5)}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}
            >
              <Text style={{ color: c.text }} className="text-xl font-bold">+</Text>
            </Pressable>
          </View>
          <View className="flex-row gap-2 mb-5">
            {[5, 10, 15, 20, 25].map((preset) => (
              <Pressable
                key={preset}
                onPress={() => setReps(preset)}
                className="flex-1 py-2 rounded-lg items-center"
                style={{
                  backgroundColor: reps === preset
                    ? "#3B82F6"
                    : theme === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "#F3F4F6",
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: reps === preset ? "#FFFFFF" : c.textSecondary }}
                >
                  {preset}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Sets Stepper */}
          <Text style={{ color: c.textSecondary }} className="text-xs font-medium mb-2">
            Sets
          </Text>
          <View className="flex-row items-center justify-center gap-4 mb-2">
            <Pressable
              onPress={() => setSets((s) => Math.max(1, s - 1))}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}
            >
              <Text style={{ color: c.text }} className="text-xl font-bold">−</Text>
            </Pressable>
            <Text style={{ color: c.text }} className="text-3xl font-bold w-24 text-center">
              {sets}
            </Text>
            <Pressable
              onPress={() => setSets((s) => s + 1)}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}
            >
              <Text style={{ color: c.text }} className="text-xl font-bold">+</Text>
            </Pressable>
          </View>
          <View className="flex-row gap-2 mb-5">
            {[1, 2, 3, 4, 5].map((preset) => (
              <Pressable
                key={preset}
                onPress={() => setSets(preset)}
                className="flex-1 py-2 rounded-lg items-center"
                style={{
                  backgroundColor: sets === preset
                    ? "#3B82F6"
                    : theme === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "#F3F4F6",
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: sets === preset ? "#FFFFFF" : c.textSecondary }}
                >
                  {preset}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Calories Preview */}
          {reps > 0 && (
            <View
              className="rounded-xl p-3 mb-4"
              style={{
                backgroundColor: theme === "dark" ? "rgba(59,130,246,0.1)" : "#EFF6FF",
              }}
            >
              <Text
                style={{ color: theme === "dark" ? "#60A5FA" : "#2563EB" }}
                className="text-sm font-semibold"
              >
                Estimated calories burned: {Math.round(caloriesBurned)}
              </Text>
            </View>
          )}

          {/* Log Button */}
          <Pressable
            onPress={handleLog}
            className="rounded-xl py-3"
            style={{ backgroundColor: "#3B82F6" }}
          >
            <Text className="text-white text-center font-bold">Log Set</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
