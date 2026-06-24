import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { WaterLog } from "@/lib/types";

const today = () => new Date().toISOString().split("T")[0];

export function useWaterLog(userId: string | undefined) {
  const queryClient = useQueryClient();
  const dateKey = today();

  const { data: entries = [], isLoading: loading } = useQuery({
    queryKey: ["water_log", userId, dateKey],
    queryFn: async () => {
      if (!userId) return [];
      const startOfDay = new Date(`${dateKey}T00:00:00Z`).toISOString();
      const endOfDay = new Date(`${dateKey}T23:59:59Z`).toISOString();

      const { data, error } = await supabase
        .from("water_log")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", startOfDay)
        .lte("logged_at", endOfDay)
        .order("logged_at", { ascending: false });

      if (error) {
        console.error("Error fetching water log:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const addWaterMutation = useMutation({
    mutationFn: async (amount_ml: number = 250) => {
      if (!userId) throw new Error("No user");
      const { data, error } = await supabase
        .from("water_log")
        .insert({ user_id: userId, amount_ml })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<WaterLog[]>(["water_log", userId, dateKey], (old) => [
        data,
        ...(old ?? []),
      ]);
    },
  });

  const totalMl = entries.reduce((sum, e) => sum + (e.amount_ml ?? 0), 0);

  return {
    entries,
    totalMl,
    loading,
    addWater: addWaterMutation.mutateAsync,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["water_log", userId] }),
  };
}
