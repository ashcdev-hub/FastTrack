import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type WeeklyWaterStats = {
  dailyAverageMl: number;
  goalHitDays: number;
  totalDays: number;
  goalHitRate: number;
};

export function useWeeklyWaterStats(userId: string | undefined, goalMl: number) {
  const { data: stats = { dailyAverageMl: 0, goalHitDays: 0, totalDays: 0, goalHitRate: 0 } } = useQuery({
    queryKey: ["weekly_water_stats", userId, goalMl],
    queryFn: async (): Promise<WeeklyWaterStats> => {
      if (!userId) return { dailyAverageMl: 0, goalHitDays: 0, totalDays: 0, goalHitRate: 0 };

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("water_log")
        .select("amount_ml, logged_at")
        .eq("user_id", userId)
        .gte("logged_at", oneWeekAgo.toISOString())
        .order("logged_at", { ascending: false });

      if (error || !data) {
        return { dailyAverageMl: 0, goalHitDays: 0, totalDays: 0, goalHitRate: 0 };
      }

      const byDay: Record<string, number> = {};
      data.forEach((entry: { logged_at: string; amount_ml: number }) => {
        const day = new Date(entry.logged_at).toISOString().split("T")[0];
        byDay[day] = (byDay[day] ?? 0) + (entry.amount_ml ?? 0);
      });

      const days = Object.values(byDay);
      const totalDays = days.length;

      if (totalDays === 0) {
        return { dailyAverageMl: 0, goalHitDays: 0, totalDays: 0, goalHitRate: 0 };
      }

      const totalMl = days.reduce((sum, ml) => sum + ml, 0);
      const avgMl = Math.round(totalMl / totalDays);
      const goalHitDays = days.filter((ml) => ml >= goalMl).length;
      const goalHitRate = Math.round((goalHitDays / totalDays) * 100);

      return {
        dailyAverageMl: avgMl,
        goalHitDays,
        totalDays,
        goalHitRate,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });

  return stats;
}
