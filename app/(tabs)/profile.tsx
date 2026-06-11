import React, { useEffect } from "react";
import { Pressable,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from "react-native";
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
import { useThemeStore } from "@/lib/theme-store";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import { AppHeader } from "@/components/AppHeader";
import { MacroProgress } from "@/components/MacroProgress";
import { FastingAchievements } from "@/components/FastingAchievements";
import { WeeklyStats } from "@/components/WeeklyStats";
import { ProfileSkeleton } from "@/components/Skeleton";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id ?? null);
  const { totals } = useFoodLog(user?.id);
  const { pastSessions, streak, completedFasts, loading: sessionLoading } = useFastingSession(user?.id);
  const goals = useGoalStore();
  const { fastingHours } = useFastingStore();
  const { theme } = useThemeStore();
  const weeklyFasting = useWeeklyFastingStats(user?.id);
  const weeklyWater = useWeeklyWaterStats(user?.id, goals.waterGoalMl);
  const { weeklyStats: weeklyWorkouts, streaks: workoutStreaks, fetchStreaks, loading: workoutLoading } =
    useWorkoutLog(user?.id, profile?.weight_kg ?? null);
  const { goals: workoutGoals } = useWorkoutGoals(user?.id);
  const { toast, error: toastError } = useToast();

  useEffect(() => {
    if (workoutGoals.length > 0) {
      fetchStreaks(workoutGoals);
    }
  }, [workoutGoals, fetchStreaks]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) toastError(error.message);
  };

  const getFirstName = (): string => {
    if (profile?.display_name) {
      return profile.display_name.split(" ")[0];
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  const isLoading = profileLoading || sessionLoading;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme === "dark" ? "#0F172A" : "#F9FAFB" }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
      <ScrollView contentContainerClassName="px-6 py-8">
        <AppHeader title={getFirstName()} />

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

            <WeeklyStats fasting={weeklyFasting} water={weeklyWater} workouts={weeklyWorkouts} />
          </>
        )}

        <Pressable
          onPress={handleSignOut}
          className="rounded-xl py-4"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" }}
        >
          <Text style={{ color: "#EF4444" }} className="text-center font-semibold">
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
