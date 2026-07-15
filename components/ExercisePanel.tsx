import React, { useState } from "react";
import { Pressable, View, Text, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import { EditGoalModal } from "@/components/EditGoalModal";
import { GlassPanel } from "@/components/GlassPanel";
import { WorkoutIcon } from "@/components/WorkoutIcon";
import { getIconKeyForExercise, EXERCISE_CATEGORIES } from "@/lib/exercise-icons";
import type { WorkoutGoal } from "@/lib/types";
import type { TodayTotals } from "@/hooks/useWorkoutLog";
const REP_QUICK_OPTIONS = [10, 15, 20, 25, 30];

type ExercisePanelProps = {
  goal: WorkoutGoal;
  todayTotal: { reps: number; sets: number; calories: number } | undefined;
  onLogSet: () => void;
  onQuickLog: (reps: number) => void;
  onUpdateGoal: (goalId: string, dailyGoal: number) => void;
  onToggleEnabled: (goalId: string, enabled: boolean) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  onRemoveFromGroup?: () => void;
};

export function ExercisePanel({
  goal,
  todayTotal,
  onLogSet,
  onQuickLog,
  onUpdateGoal,
  onToggleEnabled,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onRemoveFromGroup,
}: ExercisePanelProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmRep, setConfirmRep] = useState<number | null>(null);

  const reps = todayTotal?.reps ?? 0;
  const sets = todayTotal?.sets ?? 0;
  const calories = todayTotal?.calories ?? 0;
  const progress = Math.min(reps / goal.daily_goal, 1);
  const iconKey = goal.icon_name ?? getIconKeyForExercise(goal.exercise_type);
  const category = EXERCISE_CATEGORIES[goal.exercise_type] ?? "EXERCISE";
  const isGoalMet = reps >= goal.daily_goal;

  const handleSaveGoal = (newGoal: number) => {
    onUpdateGoal(goal.id, newGoal);
    setShowEditModal(false);
  };

  const handleConfirmLog = () => {
    if (confirmRep !== null) {
      onQuickLog(confirmRep);
      setConfirmRep(null);
    }
  };

  return (
    <GlassPanel className=" p-5">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center gap-3">
          <WorkoutIcon name={iconKey} size={32} color={accent.lime} />
          <View>
            <Text style={{ color: accent.cyan, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>
              {category}
            </Text>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.3, lineHeight: 32, textTransform: "capitalize" }}>
              {goal.exercise_type}
            </Text>
          </View>
        </View>
        <View className="flex-col items-end">
          <Text style={{ color: accent.lime, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 40, letterSpacing: -1 }}>
            {reps}<Text style={{ fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, color: c.textMuted, marginLeft: 4 }}>/ {goal.daily_goal}</Text>
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="w-full h-1 rounded-full overflow-hidden mb-6" style={{ backgroundColor: "rgba(53,53,52,0.3)" }}>
        <View
          className="h-full rounded-full"
          style={{ width: `${progress * 100}%`, backgroundColor: isGoalMet ? accent.cyan : accent.lime }}
        />
      </View>

      {/* Quick Log Chips */}
      <View className="mb-4">
        <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
          QUICK LOG REPS
        </Text>
        <View className="flex-row gap-2">
          {REP_QUICK_OPTIONS.map((repCount) => (
            <Pressable
              key={repCount}
              onPress={() => setConfirmRep(repCount)}
              className="flex-1 py-3 items-center justify-center"
              style={{ backgroundColor: c.buttonBg, borderWidth: 1, borderColor: c.cardBorder, borderRadius: 6 }}
            >
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                {repCount}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={onLogSet}
            className="py-3 px-3 items-center justify-center"
            style={{ backgroundColor: c.buttonBg, borderWidth: 1, borderColor: c.cardBorder, borderRadius: 6 }}
          >
            <MaterialCommunityIcons name="dots-horizontal" size={24} color={c.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Log Confirmation Modal */}
      <Modal visible={confirmRep !== null} transparent animationType="fade" onRequestClose={() => setConfirmRep(null)}>
        <Pressable className="flex-1 justify-center" style={{ backgroundColor: c.overlay }} onPress={() => setConfirmRep(null)}>
          <Pressable onStartShouldSetResponder={() => true} className="mx-8 p-6 rounded-2xl" style={{ backgroundColor: c.elevated }}>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 4 }}>
              Log {confirmRep} {goal.exercise_type}?
            </Text>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 24 }}>
              1 set of {confirmRep} reps — {Math.round((confirmRep ?? 0) * 1 * goal.calories_per_rep * (70 / 70))} calories
            </Text>
            <View className="flex-row gap-3">
              <Pressable onPress={() => setConfirmRep(null)} className="flex-1 py-3.5 rounded-xl items-center" style={{ backgroundColor: c.buttonBg }}>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 16 }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirmLog} className="flex-1 py-3.5 rounded-xl items-center" style={{ backgroundColor: accent.lime }}>
                <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold", fontSize: 16 }}>Log Set</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Reorder & Action Buttons */}
      <View className="flex-row gap-2 mb-2">
        <View className="flex-row gap-1">
          {!isFirst && (
            <Pressable onPress={onMoveUp} className="py-2 px-2.5 items-center justify-center" style={{ backgroundColor: c.buttonBg, borderRadius: 6 }}>
              <MaterialCommunityIcons name="chevron-up" size={16} color={c.textMuted} />
            </Pressable>
          )}
          {!isLast && (
            <Pressable onPress={onMoveDown} className="py-2 px-2.5 items-center justify-center" style={{ backgroundColor: c.buttonBg, borderRadius: 6 }}>
              <MaterialCommunityIcons name="chevron-down" size={16} color={c.textMuted} />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => setShowEditModal(true)} className="flex-1 py-2" style={{ backgroundColor: c.buttonBg, borderRadius: 6 }}>
          <View className="flex-row items-center justify-center">
            <MaterialCommunityIcons name="pencil-outline" size={14} color={c.textMuted} />
            <Text style={{ color: c.textMuted, fontFamily: "Inter_700Bold", fontSize: 12, marginLeft: 4 }}>Edit Goal</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => setShowDeleteConfirm(true)} className="flex-1 py-2" style={{ backgroundColor: c.buttonBg, borderRadius: 6 }}>
          <View className="flex-row items-center justify-center">
            <MaterialCommunityIcons name="delete-outline" size={14} color={c.textMuted} />
            <Text style={{ color: c.textMuted, fontFamily: "Inter_700Bold", fontSize: 12, marginLeft: 4 }}>
              {onRemoveFromGroup ? "Remove from Group" : "Remove"}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} transparent animationType="slide" onRequestClose={() => setShowDeleteConfirm(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowDeleteConfirm(false)}>
          <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 8 }}>
              {onRemoveFromGroup ? `Remove ${goal.exercise_type} from this group?` : "Remove this exercise?"}
            </Text>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 20 }}>
              {onRemoveFromGroup
                ? `${goal.exercise_type} will stay available under "All" exercises.`
                : "You can re-add it later from the Add Exercise menu."}
            </Text>
            <View className="flex-row gap-3">
              <Pressable onPress={() => setShowDeleteConfirm(false)} className="flex-1 py-3.5 items-center" style={{ backgroundColor: c.buttonBg }}>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (onRemoveFromGroup) onRemoveFromGroup();
                  else onToggleEnabled(goal.id, false);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-3.5 items-center"
                style={{ backgroundColor: ACCENT.rose }}
              >
                <Text style={{ color: c.textOnDark, fontFamily: "Inter_700Bold" }}>
                  {onRemoveFromGroup ? "Remove from Group" : "Remove"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <EditGoalModal
        visible={showEditModal}
        currentGoal={goal.daily_goal}
        exerciseName={goal.exercise_type}
        onSave={handleSaveGoal}
        onCancel={() => setShowEditModal(false)}
      />
    </GlassPanel>
  );
}
