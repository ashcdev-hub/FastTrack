import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { WaterLog } from "@/lib/types";
import { useConnectivity } from "@/hooks/useConnectivity";
import { withOfflineFallback } from "@/lib/offline-mutation";

const localDateKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function localDateBounds(dateKey: string) {
  const start = new Date(`${dateKey}T00:00:00`);
  const end = new Date(`${dateKey}T23:59:59.999`);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function useWaterLog(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { isOffline } = useConnectivity();
  const dateKey = localDateKey();

  const { data: entries = [], isLoading: loading } = useQuery({
    queryKey: ["water_log", userId, dateKey],
    queryFn: async () => {
      if (!userId) return [];
      const { start, end } = localDateBounds(dateKey);

      const { data, error } = await supabase
        .from("water_log")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", start)
        .lte("logged_at", end)
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
      return withOfflineFallback(
        async () => {
          const { data, error } = await supabase
            .from("water_log")
            .insert({ user_id: userId, amount_ml })
            .select()
            .single();
          if (error) throw error;
          return data;
        },
        "water_log",
        "insert",
        { user_id: userId, amount_ml },
        isOffline,
      );
    },
    onSuccess: (data) => {
      if (!data) return;
      queryClient.setQueryData<WaterLog[]>(["water_log", userId, dateKey], (old) => [
        data,
        ...(old ?? []),
      ]);
      queryClient.invalidateQueries({ queryKey: ["water_log", userId] });
    },
    onError: (error) => {
      console.error("addWater mutation failed:", error instanceof Error ? error.message : String(error));
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
