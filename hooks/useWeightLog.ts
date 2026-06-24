import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { WeightLogEntry } from "@/lib/types";

export function useWeightLog(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading: loading } = useQuery({
    queryKey: ["weight_log", userId],
    queryFn: async () => {
      if (!userId) return [];
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
        return [];
      }
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const addWeightMutation = useMutation({
    mutationFn: async (weightKg: number) => {
      if (!userId) throw new Error("No user");
      const todayStr = new Date().toISOString().split("T")[0];
      const startOfDay = `${todayStr}T00:00:00Z`;
      const endOfDay = `${todayStr}T23:59:59Z`;

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
        if (error) throw error;
        return { data, updated: true };
      }

      const { data, error } = await supabase
        .from("weight_log")
        .insert({ user_id: userId, weight_kg: weightKg })
        .select()
        .single();
      if (error) throw error;
      return { data, updated: false };
    },
    onSuccess: (result) => {
      queryClient.setQueryData<WeightLogEntry[]>(["weight_log", userId], (old) => {
        if (result.updated) {
          return (old ?? []).map((e) =>
            e.id === result.data.id ? result.data : e
          );
        }
        return [result.data, ...(old ?? [])];
      });
    },
  });

  const deleteWeightMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("weight_log").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.setQueryData<WeightLogEntry[]>(["weight_log", userId], (old) =>
        (old ?? []).filter((e) => e.id !== id)
      );
    },
  });

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
    addWeight: addWeightMutation.mutateAsync,
    deleteWeight: deleteWeightMutation.mutateAsync,
    currentWeight,
    startingWeight,
    weightChange,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["weight_log", userId] }),
  };
}
