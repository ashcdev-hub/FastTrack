import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { WorkoutLogEntry, WorkoutGoal } from "@/lib/types";

export type TodayTotals = Record<string, { reps: number; sets: number; calories: number }>;

export type WeeklyStats = {
  totalReps: number;
  totalCalories: number;
  totalSets: number;
};

export function useWorkoutLog(userId: string | undefined, weightKg: number | null) {
  const [todayEntries, setTodayEntries] = useState<WorkoutLogEntry[]>([]);
  const [todayTotals, setTodayTotals] = useState<TodayTotals>({});
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalReps: 0,
    totalCalories: 0,
    totalSets: 0,
  });
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchToday = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("workout_log")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_at", startOfDay.toISOString())
      .order("logged_at", { ascending: false });

    if (error) {
      console.error("Error fetching today's workout log:", error);
      setLoading(false);
      return;
    }

    setTodayEntries(data ?? []);

    // Calculate totals per exercise
    const totals: TodayTotals = {};
    for (const entry of data ?? []) {
      if (!totals[entry.exercise_type]) {
        totals[entry.exercise_type] = { reps: 0, sets: 0, calories: 0 };
      }
      totals[entry.exercise_type].reps += entry.reps;
      totals[entry.exercise_type].sets += entry.sets;
      totals[entry.exercise_type].calories += entry.calories_burned ?? 0;
    }
    setTodayTotals(totals);

    setLoading(false);
  }, [userId]);

  const fetchWeekly = useCallback(async () => {
    if (!userId) return;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("workout_log")
      .select("reps, sets, calories_burned")
      .eq("user_id", userId)
      .gte("logged_at", oneWeekAgo.toISOString());

    if (error) {
      console.error("Error fetching weekly workout stats:", error);
      return;
    }

    const totalReps = (data ?? []).reduce((sum, e) => sum + e.reps, 0);
    const totalSets = (data ?? []).reduce((sum, e) => sum + e.sets, 0);
    const totalCalories = (data ?? []).reduce(
      (sum, e) => sum + (e.calories_burned ?? 0),
      0
    );

    setWeeklyStats({ totalReps, totalCalories, totalSets });
  }, [userId]);

  const fetchStreaks = useCallback(async (goals: WorkoutGoal[]) => {
    if (!userId || goals.length === 0) return;

    // Fetch last 30 days of workout log
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("workout_log")
      .select("exercise_type, reps, logged_at")
      .eq("user_id", userId)
      .gte("logged_at", thirtyDaysAgo.toISOString())
      .order("logged_at", { ascending: false });

    if (error || !data) {
      console.error("Error fetching streak data:", error);
      return;
    }

    // Group by exercise type and day
    const byExerciseDay: Record<string, Record<string, number>> = {};
    for (const entry of data) {
      if (!byExerciseDay[entry.exercise_type]) {
        byExerciseDay[entry.exercise_type] = {};
      }
      const day = new Date(entry.logged_at).toISOString().split("T")[0];
      byExerciseDay[entry.exercise_type][day] =
        (byExerciseDay[entry.exercise_type][day] ?? 0) + entry.reps;
    }

    // Calculate streak for each exercise with a goal
    const newStreaks: Record<string, number> = {};
    for (const goal of goals) {
      if (!goal.enabled) continue;
      const dailyReps = byExerciseDay[goal.exercise_type] ?? {};
      let streak = 0;

      // Check from today backwards
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

    setStreaks(newStreaks);
  }, [userId]);

  useEffect(() => {
    fetchToday();
    fetchWeekly();
  }, [fetchToday, fetchWeekly]);

  const logSet = async (
    exerciseType: string,
    reps: number,
    sets: number,
    caloriesPerRep: number
  ) => {
    if (!userId) return { error: new Error("No user") };

    const caloriesBurned =
      reps * sets * caloriesPerRep * ((weightKg ?? 70) / 70);

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

    if (error) {
      console.error("Error logging workout set:", error);
      return { error };
    }

    setTodayEntries((prev) => [data, ...prev]);

    setTodayTotals((prev) => {
      const current = prev[exerciseType] ?? { reps: 0, sets: 0, calories: 0 };
      return {
        ...prev,
        [exerciseType]: {
          reps: current.reps + reps,
          sets: current.sets + sets,
          calories: current.calories + (data.calories_burned ?? 0),
        },
      };
    });

    setWeeklyStats((prev) => ({
      totalReps: prev.totalReps + reps,
      totalCalories: prev.totalCalories + (data.calories_burned ?? 0),
      totalSets: prev.totalSets + sets,
    }));

    return { error: null, data };
  };

  return {
    todayEntries,
    todayTotals,
    weeklyStats,
    streaks,
    loading,
    logSet,
    fetchStreaks,
    refetch: () => {
      fetchToday();
      fetchWeekly();
    },
  };
}
