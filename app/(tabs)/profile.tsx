import React, { useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { getThemeColors } from "@/lib/theme-colors";
import { DEFAULT_UNITS } from "@/lib/units";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import { AppHeader } from "@/components/AppHeader";
import { MacroProgress } from "@/components/MacroProgress";
import { FastingAchievements } from "@/components/FastingAchievements";
import { WeeklyStats } from "@/components/WeeklyStats";
import { WeightChart } from "@/components/WeightChart";
import { WeightTracker } from "@/components/WeightTracker";
import { ProfileSkeleton } from "@/components/Skeleton";
import UserCircleIcon from "@hugeicons/core-free-icons/dist/esm/UserCircleIcon";

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
  const { entries: weightEntries, loading: weightLoading, addWeight, deleteWeight, currentWeight, weightChange } = useWeightLog(user?.id);
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
      <ScrollView contentContainerClassName="px-6" style={{ paddingTop: 32, paddingBottom: 120 }}>
        <AppHeader title={getFirstName()} showLogo logoIcon={UserCircleIcon} />

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

            <View className="rounded-2xl p-5 mb-4" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
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
