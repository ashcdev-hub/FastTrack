import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FoodLogEntry } from "@/lib/types";

const today = () => new Date().toISOString().split("T")[0];

export function useFoodLog(userId: string | undefined) {
  const queryClient = useQueryClient();
  const dateKey = today();

  const { data: entries = [], isLoading: loading } = useQuery({
    queryKey: ["food_log", userId, dateKey],
    queryFn: async () => {
      if (!userId) return [];
      const startOfDay = new Date(`${dateKey}T00:00:00Z`).toISOString();
      const endOfDay = new Date(`${dateKey}T23:59:59Z`).toISOString();

      const { data, error } = await supabase
        .from("food_log")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", startOfDay)
        .lte("logged_at", endOfDay)
        .order("logged_at", { ascending: false });

      if (error) {
        console.error("Error fetching food log:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const addEntryMutation = useMutation({
    mutationFn: async (entry: Omit<FoodLogEntry, "id">) => {
      if (!userId) throw new Error("No user");
      const { data, error } = await supabase
        .from("food_log")
        .insert({ ...entry, user_id: userId, logged_at: entry.logged_at })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<FoodLogEntry[]>(["food_log", userId, dateKey], (old) => [
        data,
        ...(old ?? []),
      ]);
    },
  });

  const addEntriesMutation = useMutation({
    mutationFn: async (newEntries: Omit<FoodLogEntry, "id">[]) => {
      if (!userId || newEntries.length === 0) throw new Error("No entries");
      const { data, error } = await supabase
        .from("food_log")
        .insert(newEntries.map((e) => ({ ...e, user_id: userId, logged_at: e.logged_at })))
        .select();
      if (error) throw error;
      return data ?? [];
    },
    onSuccess: (data) => {
      queryClient.setQueryData<FoodLogEntry[]>(["food_log", userId, dateKey], (old) => [
        ...data,
        ...(old ?? []),
      ]);
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("food_log").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.setQueryData<FoodLogEntry[]>(["food_log", userId, dateKey], (old) =>
        (old ?? []).filter((e) => e.id !== id)
      );
    },
  });

  const totals = entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + (entry.calories ?? 0),
      protein_g: acc.protein_g + (entry.protein_g ?? 0),
      carbs_g: acc.carbs_g + (entry.carbs_g ?? 0),
      fat_g: acc.fat_g + (entry.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  const getMealsByMonth = useQuery({
    queryKey: ["food_log_monthly", userId, dateKey.slice(0, 7)],
    queryFn: async () => {
      if (!userId) return [];
      const year = new Date().getFullYear();
      const month = new Date().getMonth();
      const start = new Date(year, month, 1).toISOString();
      const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from("food_log")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", start)
        .lte("logged_at", end)
        .order("logged_at", { ascending: false });

      if (error) {
        console.error("Error fetching monthly food log:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    entries,
    totals,
    loading,
    monthlyEntries: getMealsByMonth.data ?? [],
    monthlyLoading: getMealsByMonth.isLoading,
    addEntry: addEntryMutation.mutateAsync,
    addEntries: addEntriesMutation.mutateAsync,
    deleteEntry: deleteEntryMutation.mutateAsync,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["food_log", userId] }),
    refetchMonthly: () => queryClient.invalidateQueries({ queryKey: ["food_log_monthly", userId] }),
  };
}
