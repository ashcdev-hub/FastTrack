import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PeriodLogEntry } from "@/lib/types";
import { useConnectivity } from "@/hooks/useConnectivity";
import { withOfflineFallback } from "@/lib/offline-mutation";

export function usePeriodLog(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { isOffline } = useConnectivity();

  const { data: entries = [], isLoading: loading } = useQuery({
    queryKey: ["period_log", userId],
    queryFn: async (): Promise<PeriodLogEntry[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("period_log")
        .select("*")
        .eq("user_id", userId)
        .order("log_date", { ascending: false });
      if (error) {
        console.error("Error fetching period log:", error);
        return [];
      }
      return (data ?? []).map((e: any) => ({
        ...e,
        headache: e.headache ?? false,
        bloating: e.bloating ?? false,
        cravings: e.cravings ?? false,
      }));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });

  const entriesByDate = new Map<string, PeriodLogEntry>();
  for (const entry of entries) {
    entriesByDate.set(entry.log_date, entry);
  }

  const upsertMutation = useMutation({
    mutationFn: async ({ log_date, data }: { log_date: string; data: Partial<PeriodLogEntry> }) => {
      const existing = entriesByDate.get(log_date);
      const operation = existing?.id ? "update" : "insert";
      return withOfflineFallback(
        async () => {
          if (existing) {
            const { error } = await supabase
              .from("period_log")
              .update(data)
              .eq("id", existing.id);
            if (error) throw error;
            return { ...existing, ...data };
          } else {
            const payload = { user_id: userId, log_date, ...data };
            const { data: inserted, error } = await supabase
              .from("period_log")
              .insert(payload)
              .select()
              .single();
            if (error) throw error;
            return inserted;
          }
        },
        "period_log",
        operation,
        { ...data, user_id: userId, log_date },
        isOffline,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["period_log", userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return withOfflineFallback(
        async () => {
          const { error } = await supabase.from("period_log").delete().eq("id", id);
          if (error) throw error;
          return id;
        },
        "period_log",
        "delete",
        { id },
        isOffline,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["period_log", userId] });
    },
  });

  return {
    entries,
    entriesByDate,
    loading,
    logDay: (log_date: string, data: Partial<PeriodLogEntry>) =>
      upsertMutation.mutateAsync({ log_date, data }),
    deleteEntry: deleteMutation.mutateAsync,
  };
}
