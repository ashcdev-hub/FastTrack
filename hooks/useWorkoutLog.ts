import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { WorkoutLogEntry, WorkoutGoal } from "@/lib/types";
import { useConnectivity } from "@/hooks/useConnectivity";
import { withOfflineFallback } from "@/lib/offline-mutation";

export type TodayTotals = Record<string, { reps: number; sets: number; calories: number }>;

export type WeeklyStats = {
  totalReps: number;
  totalCalories: number;
  totalSets: number;
};

export function useWorkoutLog(userId: string | undefined, weightKg: number | null) {
  const queryClient = useQueryClient();
  const { isOffline } = useConnectivity();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: todayEntries = [], isLoading: loading } = useQuery({
    queryKey: ["workout_log", "today", userId],
    queryFn: async (): Promise<WorkoutLogEntry[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("workout_log")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", startOfDay.toISOString())
        .order("logged_at", { ascending: false });

      if (error) {
        console.error("Error fetching today's workout log:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });

  const { data: weeklyStats = { totalReps: 0, totalCalories: 0, totalSets: 0 } } = useQuery({
    queryKey: ["workout_log", "weekly", userId],
    queryFn: async (): Promise<WeeklyStats> => {
      if (!userId) return { totalReps: 0, totalCalories: 0, totalSets: 0 };

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("workout_log")
        .select("reps, sets, calories_burned")
        .eq("user_id", userId)
        .gte("logged_at", oneWeekAgo.toISOString());

      if (error) return { totalReps: 0, totalCalories: 0, totalSets: 0 };

      const totalReps = (data ?? []).reduce((sum, e) => sum + e.reps * e.sets, 0);
      const totalSets = (data ?? []).reduce((sum, e) => sum + e.sets, 0);
      const totalCalories = (data ?? []).reduce((sum, e) => sum + (e.calories_burned ?? 0), 0);

      return { totalReps, totalCalories, totalSets };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  // Derived: todayTotals
  const todayTotals: TodayTotals = {};
  for (const entry of todayEntries) {
    if (!todayTotals[entry.exercise_type]) {
      todayTotals[entry.exercise_type] = { reps: 0, sets: 0, calories: 0 };
    }
    todayTotals[entry.exercise_type].reps += entry.reps * entry.sets;
    todayTotals[entry.exercise_type].sets += entry.sets;
    todayTotals[entry.exercise_type].calories += entry.calories_burned ?? 0;
  }

  const logSetMutation = useMutation({
    mutationFn: async ({
      exerciseType,
      reps,
      sets,
      caloriesPerRep,
    }: {
      exerciseType: string;
      reps: number;
      sets: number;
      caloriesPerRep: number;
    }) => {
      if (!userId) throw new Error("No user");
      const caloriesBurned = reps * sets * caloriesPerRep * ((weightKg ?? 70) / 70);

      return withOfflineFallback(
        async () => {
          const { data, error } = await supabase
            .from("workout_log")
            .insert({
              user_id: userId,
              exercise_type: exerciseType,
              reps,
              sets,
              calories_burned: Math.round(caloriesBurned * 10) / 10,
            })
            .select()
            .single();
          if (error) throw error;
          return data;
        },
        "workout_log",
        "insert",
        {
          user_id: userId,
          exercise_type: exerciseType,
          reps,
          sets,
          calories_burned: Math.round(caloriesBurned * 10) / 10,
        },
        isOffline,
      );
    },
    onSuccess: (data) => {
      if (!data) return;
      queryClient.setQueryData<WorkoutLogEntry[]>(["workout_log", "today", userId], (old) => [
        data,
        ...(old ?? []),
      ]);
      queryClient.invalidateQueries({ queryKey: ["workout_log", "weekly", userId] });
    },
    onError: (e) => console.error("[Mutation] logSet failed:", e),
  });

  const fetchStreaks = useCallback(
    async (goals: WorkoutGoal[]) => {
      if (!userId || goals.length === 0) return {};

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("workout_log")
        .select("exercise_type, reps, sets, logged_at")
        .eq("user_id", userId)
        .gte("logged_at", thirtyDaysAgo.toISOString())
        .order("logged_at", { ascending: false });

      if (error || !data) return {};

      const byExerciseDay: Record<string, Record<string, number>> = {};
      for (const entry of data) {
        if (!byExerciseDay[entry.exercise_type]) {
          byExerciseDay[entry.exercise_type] = {};
        }
        const day = new Date(entry.logged_at).toISOString().split("T")[0];
        byExerciseDay[entry.exercise_type][day] =
          (byExerciseDay[entry.exercise_type][day] ?? 0) + entry.reps * entry.sets;
      }

      const newStreaks: Record<string, number> = {};
      for (const goal of goals) {
        if (!goal.enabled) continue;
        const dailyReps = byExerciseDay[goal.exercise_type] ?? {};
        let streak = 0;

        const today = new Date();
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dayKey = d.toISOString().split("T")[0];

          if ((dailyReps[dayKey] ?? 0) >= goal.daily_goal) {
            streak++;
          } else {
            break;
          }
        }
        newStreaks[goal.exercise_type] = streak;
      }

      return newStreaks;
    },
    [userId]
  );

  return {
    todayEntries,
    todayTotals,
    weeklyStats,
    streaks: {} as Record<string, number>,
    loading,
    logSet: logSetMutation.mutateAsync,
    fetchStreaks,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ["workout_log", "today", userId] });
      queryClient.invalidateQueries({ queryKey: ["workout_log", "weekly", userId] });
    },
  };
}
