import React, { useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useFoodLog } from "@/hooks/useFoodLog";
import { useFastingSession } from "@/hooks/useFastingSession";
import { useGoalStore } from "@/store/useGoalStore";
import { useFastingStore } from "@/store/useFastingStore";
import { useWeeklyFastingStats } from "@/hooks/useWeeklyFastingStats";
import { useWeeklyWaterStats } from "@/hooks/useWeeklyWaterStats";
import { useWorkoutLog } from "@/hooks/useWorkoutLog";
import { useWorkoutGoals } from "@/hooks/useWorkoutGoals";
import { useWeightLog } from "@/hooks/useWeightLog";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { DEFAULT_UNITS } from "@/lib/units";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import { MacroProgress } from "@/components/MacroProgress";
import { FastingAchievements } from "@/components/FastingAchievements";
import { WeeklyStats } from "@/components/WeeklyStats";
import { WeightChart } from "@/components/WeightChart";
import { WeightTracker } from "@/components/WeightTracker";
import { ProfileSkeleton } from "@/components/Skeleton";
import { router } from "expo-router";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id ?? null);
  const { totals } = useFoodLog(user?.id);
  const { pastSessions, streak, completedFasts, loading: sessionLoading } = useFastingSession(user?.id);
  const goals = useGoalStore();
  const { fastingHours } = useFastingStore();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const weeklyFasting = useWeeklyFastingStats(user?.id);
  const weeklyWater = useWeeklyWaterStats(user?.id, goals.waterGoalMl);
  const { weeklyStats: weeklyWorkouts, streaks: workoutStreaks, fetchStreaks, loading: workoutLoading } =
    useWorkoutLog(user?.id, profile?.weight_kg ?? null);
  const { goals: workoutGoals } = useWorkoutGoals(user?.id);
  const { entries: weightEntries, loading: weightLoading, addWeight: addWeightRaw, deleteWeight: deleteWeightRaw, currentWeight, weightChange } = useWeightLog(user?.id);
  const addWeight = async (kg: number) => {
    try { await addWeightRaw(kg); return { error: null }; } catch (e) { return { error: e as Error }; }
  };
  const deleteWeight = async (id: string) => {
    try { await deleteWeightRaw(id); return { error: null }; } catch (e) { return { error: e as Error }; }
  };
  const { toast, error: toastError } = useToast();
  const unitPrefs = profile?.unit_preferences ?? DEFAULT_UNITS;

  useEffect(() => {
    if (workoutGoals.length > 0) fetchStreaks(workoutGoals);
  }, [workoutGoals, fetchStreaks]);

  const getFirstName = (): string => {
    if (profile?.display_name) return profile.display_name.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const isLoading = profileLoading || sessionLoading;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />

      {/* Fixed Top App Bar */}
      <View style={{ backgroundColor: c.tabBarBg, borderBottomWidth: 1, borderBottomColor: "rgba(53,53,52,0.2)", paddingTop: 8 }}>
        <View className="flex-row justify-between items-center" style={{ height: 44, paddingHorizontal: 20 }}>
          <View className="flex-row items-center gap-3">
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.elevated, borderWidth: 1, borderColor: c.cardBorder, alignItems: "center", justifyContent: "center" }}>
              <MaterialCommunityIcons name="account" size={16} color={c.textSecondary} />
            </View>
            <Text style={{ color: ACCENT.lime, fontFamily: "Inter_800ExtraBold", fontSize: 22, letterSpacing: -0.5 }}>FastTrack</Text>
          </View>
          <Pressable onPress={() => router.push("/settings")}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={c.textSecondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.3, marginBottom: 24 }}>
          {getFirstName()}
        </Text>

        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <>
            <FastingAchievements
              streak={streak}
              completedFasts={completedFasts}
              fastingHours={fastingHours}
              pushupStreak={workoutStreaks["pushups"] ?? 0}
              weeklyPushups={weeklyWorkouts.totalReps}
            />

            <MacroProgress
              calories={{ current: totals.calories, goal: goals.dailyCalories }}
              protein={{ current: totals.protein_g, goal: goals.dailyProtein }}
              carbs={{ current: totals.carbs_g, goal: goals.dailyCarbs }}
              fat={{ current: totals.fat_g, goal: goals.dailyFat }}
            />

            <View className="rounded-xl p-5 mb-6 glass-panel">
              <WeightChart entries={weightEntries} goalWeightKg={profile?.goal_weight_kg ?? null} />
              <WeightTracker
                entries={weightEntries}
                currentWeight={currentWeight}
                weightChange={weightChange}
                onAddWeight={addWeight}
                onDeleteWeight={deleteWeight}
                loading={weightLoading}
                unitPrefs={unitPrefs}
              />
            </View>

            <WeeklyStats fasting={weeklyFasting} water={weeklyWater} workouts={weeklyWorkouts} unitPrefs={unitPrefs} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
