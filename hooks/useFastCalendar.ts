import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { FastingSession } from "@/lib/types";

export function useFastCalendar(userId: string | null, year: number, month: number) {
  const [sessions, setSessions] = useState<FastingSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMonth = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

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
    }

    setSessions(data ?? []);
    setLoading(false);
  }, [userId, year, month]);

  useEffect(() => {
    fetchMonth();
  }, [fetchMonth]);

  return { sessions, loading, refetch: fetchMonth };
}
