import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { WaterLog } from "@/lib/types";

export function useWaterLog(userId: string | undefined) {
  const [entries, setEntries] = useState<WaterLog[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const fetchTodayEntries = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const startOfDay = new Date(`${today}T00:00:00Z`).toISOString();
    const endOfDay = new Date(`${today}T23:59:59Z`).toISOString();

    const { data, error } = await supabase
      .from("water_log")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_at", startOfDay)
      .lte("logged_at", endOfDay)
      .order("logged_at", { ascending: false });

    if (error) {
      console.error("Error fetching water log:", error);
    }

    setEntries(data ?? []);
    setLoading(false);
  }, [userId, today]);

  useEffect(() => {
    fetchTodayEntries();
  }, [fetchTodayEntries]);

  const addWater = async (amount_ml: number = 250) => {
    if (!userId) return { error: new Error("No user") };

    const { data, error } = await supabase
      .from("water_log")
      .insert({ user_id: userId, amount_ml })
      .select()
      .single();

    if (!error) {
      setEntries((prev) => [data, ...prev]);
    }
    return { data, error };
  };

  const totalMl = entries.reduce((sum, e) => sum + (e.amount_ml ?? 0), 0);

  return { entries, totalMl, loading, addWater, refetch: fetchTodayEntries };
}
