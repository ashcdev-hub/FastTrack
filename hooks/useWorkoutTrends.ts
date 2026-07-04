import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type DailyTrend = {
  date: string;
  totalReps: number;
  totalCalories: number;
  totalSets: number;
};

export function useWorkoutTrends(userId: string | undefined) {
  const { data: trends = [], isLoading: loading } = useQuery({
    queryKey: ["workout_trends", userId],
    queryFn: async (): Promise<DailyTrend[]> => {
      if (!userId) return [];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("workout_log")
        .select("reps, sets, calories_burned, logged_at")
        .eq("user_id", userId)
        .gte("logged_at", thirtyDaysAgo.toISOString())
        .order("logged_at", { ascending: true });

      if (error) {
        console.error("Error fetching workout trends:", error);
        return [];
      }

      const dailyMap = new Map<string, DailyTrend>();
      for (const entry of data ?? []) {
        const day = entry.logged_at.split("T")[0];
        if (!dailyMap.has(day)) {
          dailyMap.set(day, { date: day, totalReps: 0, totalCalories: 0, totalSets: 0 });
        }
        const d = dailyMap.get(day)!;
        d.totalReps += entry.reps * entry.sets;
        d.totalSets += entry.sets;
        d.totalCalories += entry.calories_burned ?? 0;
      }

      return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });

  return { trends, loading };
}
