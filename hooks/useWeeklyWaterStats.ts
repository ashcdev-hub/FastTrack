import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type WeeklyWaterStats = {
  dailyAverageMl: number;
  goalHitDays: number;
  totalDays: number;
  goalHitRate: number;
};

export function useWeeklyWaterStats(userId: string | undefined, goalMl: number) {
  const [stats, setStats] = useState<WeeklyWaterStats>({
    dailyAverageMl: 0,
    goalHitDays: 0,
    totalDays: 0,
    goalHitRate: 0,
  });

  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("water_log")
        .select("amount_ml, logged_at")
        .eq("user_id", userId)
        .gte("logged_at", oneWeekAgo.toISOString())
        .order("logged_at", { ascending: false });

      if (error || !data) return;

      // Group by day
      const byDay: Record<string, number> = {};
      data.forEach((entry: any) => {
        const day = new Date(entry.logged_at).toISOString().split("T")[0];
        byDay[day] = (byDay[day] ?? 0) + (entry.amount_ml ?? 0);
      });

      const days = Object.values(byDay);
      const totalDays = days.length;

      if (totalDays === 0) {
        setStats({ dailyAverageMl: 0, goalHitDays: 0, totalDays: 0, goalHitRate: 0 });
        return;
      }

      const totalMl = days.reduce((sum, ml) => sum + ml, 0);
      const avgMl = Math.round(totalMl / totalDays);
      const goalHitDays = days.filter((ml) => ml >= goalMl).length;
      const goalHitRate = Math.round((goalHitDays / totalDays) * 100);

      setStats({
        dailyAverageMl: avgMl,
        goalHitDays,
        totalDays,
        goalHitRate,
      });
    };

    fetchStats();
  }, [userId, goalMl]);

  return stats;
}
