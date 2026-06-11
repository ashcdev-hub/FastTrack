import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { FastingSession } from "@/lib/types";

export type WeeklyFastingStats = {
  avgDurationMin: number;
  longestFastMin: number;
  totalFasts: number;
  totalFastingHours: number;
};

export function useWeeklyFastingStats(userId: string | undefined) {
  const [stats, setStats] = useState<WeeklyFastingStats>({
    avgDurationMin: 0,
    longestFastMin: 0,
    totalFasts: 0,
    totalFastingHours: 0,
  });

  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("fasting_sessions")
        .select("fasting_duration_minutes, status")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("end_time", oneWeekAgo.toISOString())
        .order("end_time", { ascending: false });

      if (error || !data) return;

      const completed = data.filter((s: any) => s.fasting_duration_minutes != null);
      const durations = completed.map((s: any) => s.fasting_duration_minutes as number);

      if (durations.length === 0) {
        setStats({ avgDurationMin: 0, longestFastMin: 0, totalFasts: 0, totalFastingHours: 0 });
        return;
      }

      const total = durations.reduce((sum: number, d: number) => sum + d, 0);
      const avg = Math.round(total / durations.length);
      const longest = Math.max(...durations);

      setStats({
        avgDurationMin: avg,
        longestFastMin: longest,
        totalFasts: durations.length,
        totalFastingHours: Math.round(total / 60),
      });
    };

    fetchStats();
  }, [userId]);

  return stats;
}
