import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FastingSession } from "@/lib/types";

export function useFastCalendar(userId: string | null, year: number, month: number) {
  const { data: sessions = [], isLoading: loading } = useQuery({
    queryKey: ["fast_calendar", userId, year, month],
    queryFn: async () => {
      if (!userId) return [];

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from("fasting_sessions")
        .select("*")
        .eq("user_id", userId)
        .neq("status", "broken")
        .gte("end_time", startOfMonth.toISOString())
        .lte("end_time", endOfMonth.toISOString())
        .order("end_time", { ascending: false });

      if (error) {
        console.error("Error fetching calendar sessions:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });

  return {
    sessions,
    loading,
    refetch: () => {},
  };
}
