import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type DailyWorkoutData = {
  totalReps: number;
  totalSets: number;
  totalCalories: number;
  exercises: Record<string, number>;
};

export function useWorkoutCalendar(userId: string | null, year: number, month: number) {
  const { data: dailyData = {} as Record<string, DailyWorkoutData>, isLoading: loading } = useQuery({
    queryKey: ["workout_calendar", userId, year, month],
    queryFn: async () => {
      if (!userId) return {} as Record<string, DailyWorkoutData>;

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from("workout_log")
        .select("exercise_type, reps, sets, calories_burned, logged_at")
        .eq("user_id", userId)
        .gte("logged_at", startOfMonth.toISOString())
        .lte("logged_at", endOfMonth.toISOString())
        .order("logged_at", { ascending: true });

      if (error) {
        console.error("Error fetching workout calendar:", error);
        return {} as Record<string, DailyWorkoutData>;
      }

      const map: Record<string, DailyWorkoutData> = {};
      for (const entry of data ?? []) {
        const day = entry.logged_at.split("T")[0];
        if (!map[day]) {
          map[day] = { totalReps: 0, totalSets: 0, totalCalories: 0, exercises: {} };
        }
        const d = map[day];
        d.totalReps += entry.reps * entry.sets;
        d.totalSets += entry.sets;
        d.totalCalories += entry.calories_burned ?? 0;
        d.exercises[entry.exercise_type] = (d.exercises[entry.exercise_type] ?? 0) + entry.reps * entry.sets;
      }
      return map;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });

  return { dailyData, loading };
}
