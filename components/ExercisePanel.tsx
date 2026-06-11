import React, { useState } from "react";
import { Pressable, View, Text, TextInput } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Edit01Icon from "@hugeicons/core-free-icons/dist/esm/Edit01Icon";
import Delete02Icon from "@hugeicons/core-free-icons/dist/esm/Delete02Icon";
import PlusSignIcon from "@hugeicons/core-free-icons/dist/esm/PlusSignIcon";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";
import type { WorkoutGoal } from "@/lib/types";
import type { TodayTotals } from "@/hooks/useWorkoutLog";

const EXERCISE_ICONS: Record<string, string> = {
  pushups: "💪",
  crunches: "🏋️",
  situps: "🤸",
  squats: "🦵",
};

type ExercisePanelProps = {
  goal: WorkoutGoal;
  todayTotal: { reps: number; sets: number; calories: number } | undefined;
  onLogSet: () => void;
  onUpdateGoal: (goalId: string, dailyGoal: number) => void;
  onToggleEnabled: (goalId: string, enabled: boolean) => void;
};

export function ExercisePanel({
  goal,
  todayTotal,
  onLogSet,
  onUpdateGoal,
  onToggleEnabled,
}: ExercisePanelProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(goal.daily_goal));
  const [customMode, setCustomMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const reps = todayTotal?.reps ?? 0;
  const sets = todayTotal?.sets ?? 0;
  const calories = todayTotal?.calories ?? 0;
  const progress = Math.min(reps / goal.daily_goal, 1);
  const icon = EXERCISE_ICONS[goal.exercise_type] ?? "🏃";
  const isGoalMet = reps >= goal.daily_goal;

  const handleSaveGoal = () => {
    const newGoal = parseInt(goalInput);
    if (!isNaN(newGoal) && newGoal > 0) {
      onUpdateGoal(goal.id, newGoal);
    } else {
      setGoalInput(String(goal.daily_goal));
    }
    setEditingGoal(false);
  };

  return (
    <View
      className="rounded-2xl p-5 mb-3"
      style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Text className="text-2xl mr-2">{icon}</Text>
          <Text style={{ color: c.text }} className="text-lg font-bold capitalize">
            {goal.exercise_type}
          </Text>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => {
              setGoalInput(String(goal.daily_goal));
              setCustomMode(false);
              setEditingGoal(true);
            }}
            className="p-1"
          >
            <HugeiconsIcon
              icon={Edit01Icon}
              size={18}
              color={c.textMuted}
              strokeWidth={1.5}
            />
          </Pressable>
          <Pressable
            onPress={() => setShowDeleteConfirm(true)}
            className="p-1"
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              size={18}
              color={c.textMuted}
              strokeWidth={1.5}
            />
          </Pressable>
        </View>
      </View>

      {/* Progress */}
      <View className="mb-3">
        <View className="flex-row justify-between mb-1">
          <Text style={{ color: c.textSecondary }} className="text-sm">
            Today's Progress
          </Text>
          <Text
            style={{ color: isGoalMet ? "#10B981" : c.text }}
            className="text-sm font-bold"
          >
            {reps} / {goal.daily_goal}
          </Text>
        </View>
        <View
          className="h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: isGoalMet ? "#10B981" : "#3B82F6",
            }}
          />
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row justify-between mb-4">
        <View className="items-center">
          <Text style={{ color: c.text }} className="font-bold">
            {reps}
          </Text>
          <Text style={{ color: c.textMuted }} className="text-xs">
            Reps
          </Text>
        </View>
        <View className="items-center">
          <Text style={{ color: c.text }} className="font-bold">
            {sets}
          </Text>
          <Text style={{ color: c.textMuted }} className="text-xs">
            Sets
          </Text>
        </View>
        <View className="items-center">
          <Text style={{ color: c.text }} className="font-bold">
            {Math.round(calories)}
          </Text>
          <Text style={{ color: c.textMuted }} className="text-xs">
            Calories
          </Text>
        </View>
      </View>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <View
          className="rounded-xl p-4 mb-3"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" }}
        >
          <Text style={{ color: c.text }} className="font-bold mb-1">
            Remove this exercise?
          </Text>
          <Text style={{ color: c.textSecondary }} className="text-sm mb-3">
            You can re-add it later from the Add Exercise menu.
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setShowDeleteConfirm(false)}
              className="flex-1 rounded-xl py-3"
              style={{ backgroundColor: c.buttonBg }}
            >
              <Text style={{ color: c.text }} className="text-center font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onToggleEnabled(goal.id, false);
                setShowDeleteConfirm(false);
              }}
              className="flex-1 rounded-xl py-3"
              style={{ backgroundColor: "#EF4444" }}
            >
              <Text style={{ color: "#FFFFFF" }} className="text-center font-semibold">Remove</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Goal Edit Card */}
      {editingGoal && (
        <View
          className="rounded-xl p-4 mb-3"
          style={{ backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.cardBorder }}
        >
          <Text style={{ color: c.textSecondary }} className="text-xs font-medium mb-3">
            Daily Goal (reps/day)
          </Text>

          {/* Stepper */}
          <View className="flex-row items-center justify-center gap-4 mb-3">
            <Pressable
              onPress={() => {
                const v = parseInt(goalInput);
                if (!isNaN(v) && v > 10) setGoalInput(String(v - 10));
              }}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}
            >
              <Text style={{ color: c.text }} className="text-lg font-bold">−</Text>
            </Pressable>
            <Text style={{ color: c.text }} className="text-2xl font-bold w-20 text-center">
              {goalInput}
            </Text>
            <Pressable
              onPress={() => {
                const v = parseInt(goalInput);
                if (!isNaN(v)) setGoalInput(String(v + 10));
              }}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}
            >
              <Text style={{ color: c.text }} className="text-lg font-bold">+</Text>
            </Pressable>
          </View>

          {/* Preset Chips */}
          <View className="flex-row gap-2 mb-3">
            {[50, 100, 150, 200, 250].map((preset) => {
              const isActive = !customMode && parseInt(goalInput) === preset;
              return (
                <Pressable
                  key={preset}
                  onPress={() => {
                    setGoalInput(String(preset));
                    setCustomMode(false);
                  }}
                  className="flex-1 py-2 rounded-lg items-center"
                  style={{
                    backgroundColor: isActive
                      ? "#3B82F6"
                      : theme === "dark"
                      ? "rgba(255,255,255,0.05)"
                      : "#F3F4F6",
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: isActive ? "#FFFFFF" : c.textSecondary }}
                  >
                    {preset}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setCustomMode(true)}
              className="flex-1 py-2 rounded-lg items-center"
              style={{
                backgroundColor: customMode
                  ? "#3B82F6"
                  : theme === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "#F3F4F6",
              }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: customMode ? "#FFFFFF" : c.textSecondary }}
              >
                Custom
              </Text>
            </Pressable>
          </View>
          {customMode && (
            <TextInput
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder="Enter goal"
              placeholderTextColor={c.placeholder}
              keyboardType="numeric"
              className="rounded-xl px-4 py-2 mb-3"
              style={{ backgroundColor: c.inputBg, color: c.text }}
            />
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => {
                setGoalInput(String(goal.daily_goal));
                setEditingGoal(false);
              }}
              className="flex-1 rounded-xl py-2.5"
              style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}
            >
              <Text style={{ color: c.text }} className="text-center font-semibold">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSaveGoal}
              className="flex-1 rounded-xl py-2.5"
              style={{ backgroundColor: "#3B82F6" }}
            >
              <Text className="text-white text-center font-semibold">Save</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Log Set Button */}
      <Pressable
        onPress={onLogSet}
        className="rounded-xl py-3 flex-row items-center justify-center"
        style={{ backgroundColor: "#3B82F6" }}
      >
        <HugeiconsIcon icon={PlusSignIcon} size={18} color="#FFFFFF" strokeWidth={2} />
        <Text className="text-white font-bold ml-2">Log Set</Text>
      </Pressable>
    </View>
  );
}
