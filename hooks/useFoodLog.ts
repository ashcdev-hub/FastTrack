import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { FoodLogEntry } from "@/lib/types";

export function useFoodLog(userId: string | undefined) {
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
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
      .from("food_log")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_at", startOfDay)
      .lte("logged_at", endOfDay)
      .order("logged_at", { ascending: false });

    if (error) {
      console.error("Error fetching food log:", error);
    }

    setEntries(data ?? []);
    setLoading(false);
  }, [userId, today]);

  useEffect(() => {
    fetchTodayEntries();
  }, [fetchTodayEntries]);

  const addEntry = async (entry: Omit<FoodLogEntry, "id">) => {
    if (!userId) return { error: new Error("No user") };

    const { data, error } = await supabase
      .from("food_log")
      .insert({ ...entry, user_id: userId, logged_at: entry.logged_at })
      .select()
      .single();

    if (!error) {
      setEntries((prev) => [data, ...prev]);
    }
    return { data, error };
  };

  const addEntries = async (entries: Omit<FoodLogEntry, "id">[]) => {
    if (!userId || entries.length === 0) return { error: new Error("No entries") };

    const { data, error } = await supabase
      .from("food_log")
      .insert(entries.map((e) => ({ ...e, user_id: userId, logged_at: e.logged_at })))
      .select();

    if (!error && data) {
      setEntries((prev) => [...data, ...prev]);
    }
    return { data, error };
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("food_log").delete().eq("id", id);

    if (!error) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
    return { error };
  };

  const totals = entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + (entry.calories ?? 0),
      protein_g: acc.protein_g + (entry.protein_g ?? 0),
      carbs_g: acc.carbs_g + (entry.carbs_g ?? 0),
      fat_g: acc.fat_g + (entry.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  return { entries, totals, loading, addEntry, addEntries, deleteEntry, refetch: fetchTodayEntries };
}
