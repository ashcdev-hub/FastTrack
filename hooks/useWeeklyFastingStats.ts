import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FastingSession } from "@/lib/types";

export type WeeklyFastingStats = {
  avgDurationMin: number;
  longestFastMin: number;
  totalFasts: number;
  totalFastingHours: number;
};

export function useWeeklyFastingStats(userId: string | undefined) {
  const { data: stats = { avgDurationMin: 0, longestFastMin: 0, totalFasts: 0, totalFastingHours: 0 } } = useQuery({
    queryKey: ["weekly_fasting_stats", userId],
    queryFn: async (): Promise<WeeklyFastingStats> => {
      if (!userId) return { avgDurationMin: 0, longestFastMin: 0, totalFasts: 0, totalFastingHours: 0 };

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("fasting_sessions")
        .select("fasting_duration_minutes, status")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("end_time", oneWeekAgo.toISOString())
        .order("end_time", { ascending: false });

      if (error || !data) {
        return { avgDurationMin: 0, longestFastMin: 0, totalFasts: 0, totalFastingHours: 0 };
      }

      const completed = data.filter(
        (s: { fasting_duration_minutes: number | null }) => s.fasting_duration_minutes != null
      );
      const durations = completed.map(
        (s: { fasting_duration_minutes: number }) => s.fasting_duration_minutes as number
      );

      if (durations.length === 0) {
        return { avgDurationMin: 0, longestFastMin: 0, totalFasts: 0, totalFastingHours: 0 };
      }

      const total = durations.reduce((sum: number, d: number) => sum + d, 0);
      const avg = Math.round(total / durations.length);
      const longest = Math.max(...durations);

      return {
        avgDurationMin: avg,
        longestFastMin: longest,
        totalFasts: durations.length,
        totalFastingHours: Math.round(total / 60),
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });

  return stats;
}
