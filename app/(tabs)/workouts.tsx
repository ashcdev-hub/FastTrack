import React, { useState, useRef, useEffect } from "react";
import { Pressable, View, Text, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useWorkoutGoals } from "@/hooks/useWorkoutGoals";
import { useWorkoutLog } from "@/hooks/useWorkoutLog";
import { useWorkoutTrends } from "@/hooks/useWorkoutTrends";
import { useWorkoutGroups } from "@/hooks/useWorkoutGroups";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import { ExercisePanel } from "@/components/ExercisePanel";
import { GlassPanel } from "@/components/GlassPanel";
import { AddExerciseModal } from "@/components/AddExerciseModal";
import { LogSetModal } from "@/components/LogSetModal";
import { AmbientBackground } from "@/components/AmbientBackground";
import { FastTrackHeader } from "@/components/FastTrackHeader";
import { WorkoutsSkeleton } from "@/components/Skeleton";
import { WorkoutWeeklyCalendar } from "@/components/WorkoutWeeklyCalendar";
import { WorkoutCalendar } from "@/components/WorkoutCalendar";
import { WorkoutTrendsChart } from "@/components/WorkoutTrendsChart";
import { WorkoutGroupsManagerModal } from "@/components/WorkoutGroupsManagerModal";
import { useWorkoutCalendar } from "@/hooks/useWorkoutCalendar";
import { supabase } from "@/lib/supabase";
import type { WorkoutGoal } from "@/lib/types";
import { useScrollToTop } from "@react-navigation/native";

export default function WorkoutsScreen() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id ?? null);
  const { goals, loading, updateGoal, toggleEnabled, addCustomExercise, reorderGoal } = useWorkoutGoals(user?.id);
  const { todayTotals, logSet, weeklyStats, refetch: refetchLog } = useWorkoutLog(user?.id, profile?.weight_kg ?? null);
  const { trends } = useWorkoutTrends(user?.id);
  const { groups, loading: groupsLoading, removeFromGroup, reorderGroupGoal, refetch: refetchGroups } = useWorkoutGroups(user?.id);
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);

  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<WorkoutGoal | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWorkoutCalendar, setShowWorkoutCalendar] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const insightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { dailyData } = useWorkoutCalendar(user?.id ?? null, new Date().getFullYear(), new Date().getMonth());

  const enabledGoals = goals.filter((g) => g.enabled);
  const disabledGoals = goals.filter((g) => !g.enabled);

  // Group filtering
  const selectedGroup = selectedGroupId === "all" ? null : groups.find((g) => g.id === selectedGroupId);
  const activeGoalIds = selectedGroup ? new Set(selectedGroup.exercises.map((e) => e.id)) : null;
  const activeGoals = activeGoalIds ? enabledGoals.filter((g) => activeGoalIds.has(g.id)) : enabledGoals;

  // Calendar/trends filtering by group (v1: show all data regardless of group filter)
  const filteredDailyData = dailyData;
  const filteredTrends = trends;

  const totalReps = Object.values(todayTotals).reduce((sum, t) => sum + t.reps, 0);
  const totalSets = Object.values(todayTotals).reduce((sum, t) => sum + t.sets, 0);
  const totalCalories = Object.values(todayTotals).reduce((sum, t) => sum + t.calories, 0);

  const goalsMet = enabledGoals
    .filter((g) => (todayTotals[g.exercise_type]?.reps ?? 0) >= g.daily_goal)
    .map((g) => g.exercise_type)
    .join(", ");

  const fetchInsight = async () => {
    if (!user?.id) return;
    setInsightLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-coach", {
        body: {
          type: "workout",
          context: {
            workoutExercises: enabledGoals.map((g) => `${g.exercise_type}: ${todayTotals[g.exercise_type]?.reps ?? 0}/${g.daily_goal}`).join("; "),
            workoutReps: totalReps,
            workoutSets: totalSets,
            workoutCalories: Math.round(totalCalories),
            weeklyReps: weeklyStats.totalReps,
            weeklyCalories: Math.round(weeklyStats.totalCalories),
            goalsMet: goalsMet || "none",
            daysWorkedOut: 0,
          },
        },
      });
      if (data?.reply) setInsight(data.reply);
    } catch (e) {
      console.error("Failed to fetch insight:", e);
    }
    setInsightLoading(false);
  };

  const triggerInsight = () => {
    if (insightTimer.current) clearTimeout(insightTimer.current);
    insightTimer.current = setTimeout(fetchInsight, 2000);
  };

  const handleLogSet = (goal: WorkoutGoal) => { setSelectedGoal(goal); setShowLogModal(true); };
  const handleQuickLog = (goal: WorkoutGoal, reps: number) => {
    logSet({
      exerciseType: goal.exercise_type,
      reps,
      sets: 1,
      caloriesPerRep: goal.calories_per_rep,
    });
    triggerInsight();
  };
  const handleLog = async (reps: number, sets: number) => {
    if (!selectedGoal) return;
    await logSet({
      exerciseType: selectedGoal.exercise_type,
      reps,
      sets,
      caloriesPerRep: selectedGoal.calories_per_rep,
    });
    triggerInsight();
  };
  const handleUpdateGoal = async (goalId: string, dailyGoal: number) => { await updateGoal(goalId, { daily_goal: dailyGoal }); };
  const handleToggleEnabled = async (goalId: string, enabled: boolean) => { await toggleEnabled(goalId, enabled); };
  const handleAddExercise = async (exerciseType: string, dailyGoal: number, caloriesPerRep: number, iconName?: string) => { await addCustomExercise(exerciseType, dailyGoal, caloriesPerRep, iconName); };
  const handleReinstate = async (goalId: string) => { await toggleEnabled(goalId, true); };
  const handleMoveUp = async (goalId: string) => { await reorderGoal(goalId, "up"); };
  const handleMoveDown = async (goalId: string) => { await reorderGoal(goalId, "down"); };

  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef as any);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      <AmbientBackground />
      <FastTrackHeader />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 85, paddingHorizontal: 20, paddingTop: 24 }}
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
        ) : (
          <>
            {/* Group selector — only shown when groups exist */}
            {groups.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 mb-section-gap">
                <View className="flex-row gap-2 px-5">
                  <Pressable
                    onPress={() => setSelectedGroupId("all")}
                    className="py-3 px-4 rounded-xl"
                    style={{ backgroundColor: selectedGroupId === "all" ? accent.lime : c.cardBgAlt }}
                  >
                    <Text
                      style={{
                        color: selectedGroupId === "all" ? c.textOnAccent : c.text,
                        fontFamily: "Inter_700Bold",
                        fontSize: 14,
                      }}
                    >
                      All
                    </Text>
                  </Pressable>
                  {groups.map((g) => (
                    <Pressable
                      key={g.id}
                      onPress={() => setSelectedGroupId(g.id)}
                      className="py-3 px-4 rounded-xl"
                      style={{ backgroundColor: selectedGroupId === g.id ? accent.lime : c.cardBgAlt }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          color: selectedGroupId === g.id ? c.textOnAccent : c.text,
                          fontFamily: "Inter_700Bold",
                          fontSize: 14,
                        }}
                      >
                        {g.name}
                      </Text>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => setShowGroupManager(true)}
                    className="py-3 px-4 rounded-xl items-center justify-center"
                    style={{ backgroundColor: c.cardBgAlt, borderWidth: 1, borderColor: c.cardBorder, borderStyle: "dashed" }}
                  >
                    <MaterialCommunityIcons name="cog" size={16} color={c.textMuted} />
                  </Pressable>
                </View>
              </ScrollView>
            )}

            {/* Create first group prompt — only when no groups exist */}
            {groups.length === 0 && !groupsLoading && (
              <Pressable
                onPress={() => setShowGroupManager(true)}
                className="flex-row items-center justify-center py-3 px-4 rounded-xl mb-section-gap"
                style={{ backgroundColor: c.cardBgAlt, borderWidth: 1, borderColor: c.cardBorder, borderStyle: "dashed" }}
              >
                <MaterialCommunityIcons name="plus" size={16} color={accent.lime} />
                <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold", fontSize: 14, marginLeft: 6 }}>
                  Create Group
                </Text>
              </Pressable>
            )}

            {activeGoals.length === 0 ? (
              selectedGroupId !== "all" ? (
                <GlassPanel className="p-6 items-center mb-section-gap">
                  <MaterialCommunityIcons name="dumbbell" size={32} color={c.textMuted} style={{ opacity: 0.4 }} />
                  <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginTop: 8 }}>
                    No exercises in this group yet.
                  </Text>
                </GlassPanel>
              ) : (
                <GlassPanel className="p-6 items-center mb-section-gap">
                  <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", textAlign: "center" }}>
                    No exercises enabled. Add one to get started!
                  </Text>
                </GlassPanel>
              )
            ) : (
              <View className="flex-col gap-8 mb-section-gap">
                {activeGoals.map((goal, idx) => (
                  <ExercisePanel
                    key={goal.id}
                    goal={goal}
                    todayTotal={todayTotals[goal.exercise_type]}
                    onLogSet={() => handleLogSet(goal)}
                    onQuickLog={(reps) => handleQuickLog(goal, reps)}
                    onUpdateGoal={handleUpdateGoal}
                    onToggleEnabled={handleToggleEnabled}
                    onMoveUp={selectedGroup
                      ? () => reorderGroupGoal(selectedGroup.id, goal.id, "up")
                      : () => handleMoveUp(goal.id)
                    }
                    onMoveDown={selectedGroup
                      ? () => reorderGroupGoal(selectedGroup.id, goal.id, "down")
                      : () => handleMoveDown(goal.id)
                    }
                    isFirst={idx === 0}
                    isLast={idx === activeGoals.length - 1}
                    onRemoveFromGroup={selectedGroup
                      ? () => removeFromGroup(selectedGroup.id, goal.id)
                      : undefined
                    }
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* Add Custom Exercise */}
        <Pressable
          onPress={() => setShowAddModal(true)}
          className="w-full border-2 border-dashed py-8 flex-col items-center justify-center gap-2 mb-section-gap"
          style={{ borderColor: "rgba(68,73,51,0.4)" }}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={28} color={accent.lime} />
          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
            Add Custom Exercise
          </Text>
        </Pressable>

        {/* Previous Exercises */}
        {activeGoals.length > 0 && (
          <View className="mb-section-gap">
            <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>
              {selectedGroup ? `${selectedGroup.name.toUpperCase()} HISTORY` : "PREVIOUS EXERCISES"}
            </Text>
            <WorkoutWeeklyCalendar
              dailyData={filteredDailyData}
              goals={activeGoals}
              onViewCalendar={() => setShowWorkoutCalendar(true)}
            />
            {filteredTrends.length > 1 && (
              <WorkoutTrendsChart trends={filteredTrends} />
            )}
          </View>
        )}

        {/* AI Insight Panel */}
        {insight !== null && (
          <GlassPanel className="mb-section-gap overflow-hidden">
            <View className="flex-col items-center justify-center p-6">
              <Text style={{ color: accent.lime, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>
                INSIGHT
              </Text>
              <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", maxWidth: 280, lineHeight: 20 }}>
                {insight}
              </Text>
              {insightLoading && (
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 8 }}>
                  Updating...
                </Text>
              )}
            </View>
          </GlassPanel>
        )}
      </ScrollView>

      <LogSetModal visible={showLogModal} goal={selectedGoal} weightKg={profile?.weight_kg ?? null} onClose={() => setShowLogModal(false)} onLog={handleLog} />
      <AddExerciseModal visible={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddExercise} disabledGoals={disabledGoals} onReinstate={handleReinstate} />
      <WorkoutCalendar visible={showWorkoutCalendar} userId={user?.id ?? null} goals={activeGoals} onClose={() => setShowWorkoutCalendar(false)} />
      <WorkoutGroupsManagerModal visible={showGroupManager} userId={user?.id} onClose={() => setShowGroupManager(false)} />
    </SafeAreaView>
  );
}
