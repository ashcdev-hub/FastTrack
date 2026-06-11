import React, { useState } from "react";
import { Pressable, View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useWorkoutGoals } from "@/hooks/useWorkoutGoals";
import { useWorkoutLog } from "@/hooks/useWorkoutLog";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { AppHeader } from "@/components/AppHeader";
import { ExercisePanel } from "@/components/ExercisePanel";
import { LogSetModal } from "@/components/LogSetModal";
import { AddExerciseModal } from "@/components/AddExerciseModal";
import { WorkoutsSkeleton } from "@/components/Skeleton";
import { HugeiconsIcon } from "@hugeicons/react-native";
import PlusSignIcon from "@hugeicons/core-free-icons/dist/esm/PlusSignIcon";
import RepeatIcon from "@hugeicons/core-free-icons/dist/esm/RepeatIcon";
import FlameIcon from "@hugeicons/core-free-icons/dist/esm/FlameIcon";
import Target01Icon from "@hugeicons/core-free-icons/dist/esm/Target01Icon";
import Dumbbell01Icon from "@hugeicons/core-free-icons/dist/esm/Dumbbell01Icon";
import type { WorkoutGoal } from "@/lib/types";

export default function WorkoutsScreen() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id ?? null);
  const { goals, loading, updateGoal, toggleEnabled, addCustomExercise } = useWorkoutGoals(user?.id);
  const { todayTotals, logSet } = useWorkoutLog(user?.id, profile?.weight_kg ?? null);
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  const [selectedGoal, setSelectedGoal] = useState<WorkoutGoal | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const enabledGoals = goals.filter((g) => g.enabled);
  const disabledGoals = goals.filter((g) => !g.enabled);

  const handleLogSet = (goal: WorkoutGoal) => { setSelectedGoal(goal); setShowLogModal(true); };
  const handleLog = async (reps: number, sets: number) => {
    if (!selectedGoal) return;
    await logSet(selectedGoal.exercise_type, reps, sets, selectedGoal.calories_per_rep);
  };
  const handleUpdateGoal = async (goalId: string, dailyGoal: number) => { await updateGoal(goalId, { daily_goal: dailyGoal }); };
  const handleToggleEnabled = async (goalId: string, enabled: boolean) => { await toggleEnabled(goalId, enabled); };
  const handleAddExercise = async (exerciseType: string, dailyGoal: number, caloriesPerRep: number) => { await addCustomExercise(exerciseType, dailyGoal, caloriesPerRep); };
  const handleReinstate = async (goalId: string) => { await toggleEnabled(goalId, true); };

  const totalReps = Object.values(todayTotals).reduce((sum, t) => sum + t.reps, 0);
  const totalCalories = Math.round(Object.values(todayTotals).reduce((sum, t) => sum + t.calories, 0));
  const goalsAchieved = enabledGoals.filter((g) => {
    const total = todayTotals[g.exercise_type];
    return total && total.reps >= g.daily_goal;
  }).length;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      <ScrollView contentContainerClassName="px-6" style={{ paddingTop: 32, paddingBottom: 120 }}>
        <AppHeader title="Workouts" showLogo logoIcon={Dumbbell01Icon} />

        {/* Today's Summary */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 rounded-xl p-4 items-center" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
            <HugeiconsIcon icon={RepeatIcon} size={28} color={ACCENT.mint} strokeWidth={1.5} />
            <Text style={{ color: ACCENT.mint, fontFamily: "PlusJakartaSans_700Bold" }} className="text-2xl mt-1">
              {totalReps}
            </Text>
            <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mt-1 text-center">
              Total Reps
            </Text>
          </View>

          <View className="flex-1 rounded-xl p-4 items-center" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
            <HugeiconsIcon icon={FlameIcon} size={28} color={ACCENT.coral} strokeWidth={1.5} />
            <Text style={{ color: ACCENT.coral, fontFamily: "PlusJakartaSans_700Bold" }} className="text-2xl mt-1">
              {totalCalories}
            </Text>
            <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mt-1 text-center">
              Calories Burned
            </Text>
          </View>

          <View className="flex-1 rounded-xl p-4 items-center" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
            <HugeiconsIcon icon={Target01Icon} size={28} color={ACCENT.sky} strokeWidth={1.5} />
            <Text style={{ color: ACCENT.sky, fontFamily: "PlusJakartaSans_700Bold" }} className="text-2xl mt-1">
              {goalsAchieved}/{enabledGoals.length}
            </Text>
            <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mt-1 text-center">
              Goals Achieved
            </Text>
          </View>
        </View>

        {loading ? (
          <WorkoutsSkeleton />
        ) : enabledGoals.length === 0 ? (
          <View className="rounded-2xl p-6 items-center" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
            <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-center mb-4">
              No exercises enabled. Add one to get started!
            </Text>
          </View>
        ) : (
          enabledGoals.map((goal) => (
            <ExercisePanel
              key={goal.id}
              goal={goal}
              todayTotal={todayTotals[goal.exercise_type]}
              onLogSet={() => handleLogSet(goal)}
              onUpdateGoal={handleUpdateGoal}
              onToggleEnabled={handleToggleEnabled}
            />
          ))
        )}

        <Pressable
          onPress={() => setShowAddModal(true)}
          className="rounded-2xl py-4 flex-row items-center justify-center"
          style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={20} color={ACCENT.mint} strokeWidth={2} />
          <Text style={{ color: ACCENT.mint, fontFamily: "PlusJakartaSans_700Bold" }} className="ml-2">Add Exercise</Text>
        </Pressable>
      </ScrollView>

      <LogSetModal visible={showLogModal} goal={selectedGoal} weightKg={profile?.weight_kg ?? null} onClose={() => setShowLogModal(false)} onLog={handleLog} />
      <AddExerciseModal visible={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddExercise} disabledGoals={disabledGoals} onReinstate={handleReinstate} />
    </SafeAreaView>
  );
}
