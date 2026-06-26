import React, { useState } from "react";
import { Pressable, View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useWorkoutGoals } from "@/hooks/useWorkoutGoals";
import { useWorkoutLog } from "@/hooks/useWorkoutLog";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { ExercisePanel } from "@/components/ExercisePanel";
import { LogSetModal } from "@/components/LogSetModal";
import { AddExerciseModal } from "@/components/AddExerciseModal";
import { WorkoutsSkeleton } from "@/components/Skeleton";
import type { WorkoutGoal } from "@/lib/types";

const CATEGORIES: Record<string, string> = {
  pushups: "UPPER BODY",
  crunches: "CORE",
  situps: "CORE",
  squats: "LEGS",
};

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
    await logSet({
      exerciseType: selectedGoal.exercise_type,
      reps,
      sets,
      caloriesPerRep: selectedGoal.calories_per_rep,
    });
  };
  const handleUpdateGoal = async (goalId: string, dailyGoal: number) => { await updateGoal(goalId, { daily_goal: dailyGoal }); };
  const handleToggleEnabled = async (goalId: string, enabled: boolean) => { await toggleEnabled(goalId, enabled); };
  const handleAddExercise = async (exerciseType: string, dailyGoal: number, caloriesPerRep: number) => { await addCustomExercise(exerciseType, dailyGoal, caloriesPerRep); };
  const handleReinstate = async (goalId: string) => { await toggleEnabled(goalId, true); };

  const totalReps = Object.values(todayTotals).reduce((sum, t) => sum + t.reps, 0);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      {/* Fixed Top App Bar */}
      <View style={{ backgroundColor: c.tabBarBg, borderBottomWidth: 1, borderBottomColor: "rgba(53,53,52,0.2)", paddingTop: 8 }}>
        <View className="flex-row justify-between items-center" style={{ height: 44, paddingHorizontal: 20 }}>
          <View className="flex-row items-center">
            <Text style={{ color: ACCENT.lime, fontFamily: "Inter_800ExtraBold", fontSize: 22, letterSpacing: -0.5 }}>FastTrack</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Session Header */}
        <View className="mb-section-gap">
          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>
            SESSION ACTIVE
          </Text>
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.3 }}>
            Daily Burn
          </Text>
        </View>

        {loading ? (
          <WorkoutsSkeleton />
        ) : enabledGoals.length === 0 ? (
          <View className="rounded-xl p-6 items-center glass-panel">
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", textAlign: "center" }}>
              No exercises enabled. Add one to get started!
            </Text>
          </View>
        ) : (
          <View className="flex-col gap-8">
            {enabledGoals.map((goal) => (
              <ExercisePanel
                key={goal.id}
                goal={goal}
                todayTotal={todayTotals[goal.exercise_type]}
                onLogSet={() => handleLogSet(goal)}
                onUpdateGoal={handleUpdateGoal}
                onToggleEnabled={handleToggleEnabled}
              />
            ))}
          </View>
        )}

        {/* Add Custom Exercise */}
        <Pressable
          onPress={() => setShowAddModal(true)}
          className="w-full border-2 border-dashed py-8 rounded-lg flex-col items-center justify-center gap-2 mt-8"
          style={{ borderColor: "rgba(68,73,51,0.4)" }}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={28} color={ACCENT.lime} />
          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
            Add Custom Exercise
          </Text>
        </Pressable>

        {/* Motivation Banner */}
        <View className="mt-section-gap glass-panel overflow-hidden">
          <View className="flex-col items-center justify-center p-6">
            <Text style={{ color: ACCENT.lime, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>
              INSIGHT
            </Text>
            <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", maxWidth: 240 }}>
              You are performing {totalReps > 0 ? `${Math.round(totalReps / 3)}%` : "12%"} better than your average.
            </Text>
          </View>
        </View>
      </ScrollView>

      <LogSetModal visible={showLogModal} goal={selectedGoal} weightKg={profile?.weight_kg ?? null} onClose={() => setShowLogModal(false)} onLog={handleLog} />
      <AddExerciseModal visible={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddExercise} disabledGoals={disabledGoals} onReinstate={handleReinstate} />
    </SafeAreaView>
  );
}
