import React, { useState } from "react";
import { Pressable, View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { EditGoalModal } from "@/components/EditGoalModal";
import type { WorkoutGoal } from "@/lib/types";
import type { TodayTotals } from "@/hooks/useWorkoutLog";

const EXERCISE_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  pushups: "dumbbell",
  crunches: "circle-multiple",
  situps: "circle-multiple",
  squats: "human",
};

const EXERCISE_CATEGORIES: Record<string, string> = {
  pushups: "UPPER BODY",
  crunches: "CORE",
  situps: "CORE",
  squats: "LEGS",
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const reps = todayTotal?.reps ?? 0;
  const sets = todayTotal?.sets ?? 0;
  const calories = todayTotal?.calories ?? 0;
  const progress = Math.min(reps / goal.daily_goal, 1);
  const iconName = EXERCISE_ICONS[goal.exercise_type] ?? "dumbbell";
  const category = EXERCISE_CATEGORIES[goal.exercise_type] ?? "EXERCISE";
  const isGoalMet = reps >= goal.daily_goal;

  const handleSaveGoal = (newGoal: number) => {
    onUpdateGoal(goal.id, newGoal);
    setShowEditModal(false);
  };

  return (
    <View className="glass-panel p-4">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text style={{ color: ACCENT.cyan, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>
            {category}
          </Text>
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.3, lineHeight: 32, textTransform: "capitalize" }}>
            {goal.exercise_type}
          </Text>
        </View>
        <View className="flex-col items-end">
          <Text style={{ color: ACCENT.lime, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 40, letterSpacing: -1 }}>
            {reps}<Text style={{ fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, color: c.textMuted, marginLeft: 4 }}>/ {goal.daily_goal}</Text>
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="w-full h-1 rounded-full overflow-hidden mb-6" style={{ backgroundColor: "rgba(53,53,52,0.3)" }}>
        <View
          className="h-full rounded-full"
          style={{ width: `${progress * 100}%`, backgroundColor: isGoalMet ? ACCENT.cyan : ACCENT.lime }}
        />
      </View>

      {/* Stepper Controls */}
      <Pressable onPress={onLogSet} className="flex-row items-center justify-between mb-4" style={{ backgroundColor: c.elevated, borderRadius: 8, padding: 4 }}>
        <View className="w-touch-target h-touch-target items-center justify-center rounded" style={{ backgroundColor: "transparent" }}>
          <MaterialCommunityIcons name="minus" size={20} color={c.textMuted} />
        </View>
        <View className="flex-col items-center">
          <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 32, lineHeight: 32 }}>
            {reps}
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 1 }}>
            REPS TODAY
          </Text>
        </View>
        <View className="w-touch-target h-touch-target items-center justify-center rounded" style={{ backgroundColor: "transparent" }}>
          <MaterialCommunityIcons name="plus" size={20} color={c.textSecondary} />
        </View>
      </Pressable>

      {/* Action Buttons */}
      <View className="flex-row gap-2 mb-2">
        <Pressable onPress={() => setShowEditModal(true)} className="flex-1 py-3 rounded-lg items-center flex-row justify-center gap-2" style={{ backgroundColor: c.buttonBg }}>
          <MaterialCommunityIcons name="pencil-outline" size={16} color={c.textMuted} />
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>Edit Goal</Text>
        </Pressable>
        <Pressable onPress={() => setShowDeleteConfirm(true)} className="flex-1 py-3 rounded-lg items-center flex-row justify-center gap-2" style={{ backgroundColor: c.buttonBg }}>
          <MaterialCommunityIcons name="delete-outline" size={16} color={c.textMuted} />
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>Remove</Text>
        </Pressable>
      </View>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <View className="rounded-lg p-4 mb-3" style={{ backgroundColor: ACCENT.roseBg, borderWidth: 1, borderColor: ACCENT.roseBorder }}>
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", marginBottom: 4 }}>Remove this exercise?</Text>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 12 }}>You can re-add it later from the Add Exercise menu.</Text>
          <View className="flex-row gap-3">
            <Pressable onPress={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-lg items-center" style={{ backgroundColor: c.buttonBg }}>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={() => { onToggleEnabled(goal.id, false); setShowDeleteConfirm(false); }} className="flex-1 py-3 rounded-lg items-center" style={{ backgroundColor: ACCENT.rose }}>
              <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold" }}>Remove</Text>
            </Pressable>
          </View>
        </View>
      )}

      <EditGoalModal
        visible={showEditModal}
        currentGoal={goal.daily_goal}
        exerciseName={goal.exercise_type}
        onSave={handleSaveGoal}
        onCancel={() => setShowEditModal(false)}
      />
    </View>
  );
}
