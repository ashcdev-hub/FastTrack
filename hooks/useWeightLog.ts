import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { WeightLogEntry } from "@/lib/types";

export function useWeightLog(userId: string | undefined) {
  const [entries, setEntries] = useState<WeightLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("weight_log")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_at", thirtyDaysAgo.toISOString())
      .order("logged_at", { ascending: false });

    if (error) {
      console.error("Error fetching weight log:", error);
    }

    setEntries(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addWeight = async (weightKg: number) => {
    if (!userId) return { error: new Error("No user") };

    const today = new Date().toISOString().split("T")[0];
    const startOfDay = `${today}T00:00:00Z`;
    const endOfDay = `${today}T23:59:59Z`;

    const { data: existing } = await supabase
      .from("weight_log")
      .select("id")
      .eq("user_id", userId)
      .gte("logged_at", startOfDay)
      .lte("logged_at", endOfDay)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("weight_log")
        .update({ weight_kg: weightKg })
        .eq("id", existing.id)
        .select()
        .single();

      if (!error) {
        setEntries((prev) => {
          const updated = prev.map((e) => (e.id === existing.id ? data : e));
          return updated.sort(
            (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
          );
        });
      }
      return { data, error };
    }

    const { data, error } = await supabase
      .from("weight_log")
      .insert({ user_id: userId, weight_kg: weightKg })
      .select()
      .single();

    if (!error) {
      setEntries((prev) => [data, ...prev]);
    }
    return { data, error };
  };

  const deleteWeight = async (id: string) => {
    if (!userId) return { error: new Error("No user") };

    const { error } = await supabase.from("weight_log").delete().eq("id", id);

    if (!error) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
    return { error };
  };

  const currentWeight = entries.length > 0 ? entries[0].weight_kg : null;
  const startingWeight =
    entries.length > 0 ? entries[entries.length - 1].weight_kg : null;
  const weightChange =
    currentWeight !== null && startingWeight !== null
      ? currentWeight - startingWeight
      : null;

  return {
    entries,
    loading,
    addWeight,
    deleteWeight,
    currentWeight,
    startingWeight,
    weightChange,
    refetch: fetchEntries,
  };
}