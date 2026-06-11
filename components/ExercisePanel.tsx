import React, { useState } from "react";
import { Pressable, View, Text, TextInput } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Edit01Icon from "@hugeicons/core-free-icons/dist/esm/Edit01Icon";
import Delete02Icon from "@hugeicons/core-free-icons/dist/esm/Delete02Icon";
import PlusSignIcon from "@hugeicons/core-free-icons/dist/esm/PlusSignIcon";
import PushUpBarIcon from "@hugeicons/core-free-icons/dist/esm/PushUpBarIcon";
import BodyPartSixPackIcon from "@hugeicons/core-free-icons/dist/esm/BodyPartSixPackIcon";
import WorkoutSquatsIcon from "@hugeicons/core-free-icons/dist/esm/WorkoutSquatsIcon";
import BodyPartMuscleIcon from "@hugeicons/core-free-icons/dist/esm/BodyPartMuscleIcon";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import type { WorkoutGoal } from "@/lib/types";
import type { TodayTotals } from "@/hooks/useWorkoutLog";

const EXERCISE_CONFIG: Record<string, { icon: any }> = {
  pushups: { icon: PushUpBarIcon },
  crunches: { icon: BodyPartSixPackIcon },
  situps: { icon: BodyPartSixPackIcon },
  squats: { icon: WorkoutSquatsIcon },
};

const DEFAULT_CONFIG = { icon: BodyPartMuscleIcon };

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
  const config = EXERCISE_CONFIG[goal.exercise_type] ?? DEFAULT_CONFIG;
  const IconComponent = config.icon;
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
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: c.cardBgAlt,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            <HugeiconsIcon icon={IconComponent} size={18} color={c.textSecondary} strokeWidth={1.5} />
          </View>
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-lg capitalize">
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
            <HugeiconsIcon icon={Edit01Icon} size={18} color={c.textMuted} strokeWidth={1.5} />
          </Pressable>
          <Pressable
            onPress={() => setShowDeleteConfirm(true)}
            className="p-1"
          >
            <HugeiconsIcon icon={Delete02Icon} size={18} color={c.textMuted} strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>

      {/* Progress */}
      <View className="mb-3">
        <View className="flex-row justify-between mb-1">
          <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">
            Today&apos;s Progress
          </Text>
          <Text
            style={{ color: isGoalMet ? ACCENT.mint : c.text, fontFamily: "PlusJakartaSans_700Bold" }}
            className="text-sm"
          >
            {reps} / {goal.daily_goal}
          </Text>
        </View>
        <View
          className="h-2.5 rounded-full overflow-hidden"
          style={{ backgroundColor: c.cardBgAlt }}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: isGoalMet ? ACCENT.mint : c.textMuted,
            }}
          />
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row justify-between mb-4">
        <View className="items-center">
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }}>{reps}</Text>
          <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs">Reps</Text>
        </View>
        <View className="items-center">
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }}>{sets}</Text>
          <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs">Sets</Text>
        </View>
        <View className="items-center">
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }}>{Math.round(calories)}</Text>
          <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs">Calories</Text>
        </View>
      </View>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <View className="rounded-xl p-4 mb-3" style={{ backgroundColor: ACCENT.roseBg, borderWidth: 1, borderColor: ACCENT.roseBorder }}>
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="mb-1">
            Remove this exercise?
          </Text>
          <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-sm mb-3">
            You can re-add it later from the Add Exercise menu.
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setShowDeleteConfirm(false)}
              className="flex-1 rounded-xl py-3"
              style={{ backgroundColor: c.buttonBg }}
            >
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-center">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onToggleEnabled(goal.id, false);
                setShowDeleteConfirm(false);
              }}
              className="flex-1 rounded-xl py-3"
              style={{ backgroundColor: ACCENT.rose }}
            >
              <Text style={{ color: "#FFFFFF", fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-center">Remove</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Goal Edit Card */}
      {editingGoal && (
        <View className="rounded-xl p-4 mb-3" style={{ backgroundColor: c.cardBgAlt, borderWidth: 1, borderColor: c.cardBorder }}>
          <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_500Medium" }} className="text-xs mb-3">
            Daily Goal (reps/day)
          </Text>

          <View className="flex-row items-center justify-center gap-4 mb-3">
            <Pressable
              onPress={() => {
                const v = parseInt(goalInput);
                if (!isNaN(v) && v > 10) setGoalInput(String(v - 10));
              }}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: c.buttonBg }}
            >
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-lg">−</Text>
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-2xl w-20 text-center">
              {goalInput}
            </Text>
            <Pressable
              onPress={() => {
                const v = parseInt(goalInput);
                if (!isNaN(v)) setGoalInput(String(v + 10));
              }}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: c.buttonBg }}
            >
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-lg">+</Text>
            </Pressable>
          </View>

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
                    backgroundColor: isActive ? ACCENT.mint : c.buttonBg,
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{
                      color: isActive ? "#0C0C0E" : c.textSecondary,
                      fontFamily: "PlusJakartaSans_600SemiBold",
                    }}
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
                backgroundColor: customMode ? ACCENT.mint : c.buttonBg,
              }}
            >
              <Text
                className="text-xs font-medium"
                style={{
                  color: customMode ? "#0C0C0E" : c.textSecondary,
                  fontFamily: "PlusJakartaSans_600SemiBold",
                }}
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
              style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "PlusJakartaSans_500Medium" }}
            />
          )}

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => {
                setGoalInput(String(goal.daily_goal));
                setEditingGoal(false);
              }}
              className="flex-1 rounded-xl py-2.5"
              style={{ backgroundColor: c.buttonBg }}
            >
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-center">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSaveGoal}
              className="flex-1 rounded-xl py-2.5"
              style={{ backgroundColor: ACCENT.mint }}
            >
              <Text style={{ color: "#0C0C0E", fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-center">Save</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Log Set Button */}
      <Pressable
        onPress={onLogSet}
        className="rounded-xl py-3 flex-row items-center justify-center"
        style={{ backgroundColor: c.buttonBg }}
      >
        <HugeiconsIcon icon={PlusSignIcon} size={18} color={c.text} strokeWidth={2} />
        <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="ml-2">Log Set</Text>
      </Pressable>
    </View>
  );
}
