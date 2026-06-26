import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FastCheckIn } from "@/lib/types";
import { useConnectivity } from "@/hooks/useConnectivity";
import { withOfflineFallback } from "@/lib/offline-mutation";

export function useFastCheckIns(userId: string | undefined, sessionId: string | null) {
  const queryClient = useQueryClient();
  const { isOffline } = useConnectivity();

  const { data: checkIns = [] } = useQuery({
    queryKey: ["fast_check_ins", sessionId],
    queryFn: async (): Promise<FastCheckIn[]> => {
      if (!userId || !sessionId) return [];

      const { data } = await supabase
        .from("fast_check_ins")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      return data ?? [];
    },
    enabled: !!userId && !!sessionId,
    staleTime: 1000 * 60 * 5,
  });

  const addCheckInMutation = useMutation({
    mutationFn: async ({ mood, note, phase }: { mood: number; note: string; phase: string }) => {
      if (!userId || !sessionId) throw new Error("No user or session");
      return withOfflineFallback(
        async () => {
          const { data, error } = await supabase
            .from("fast_check_ins")
            .insert({
              user_id: userId,
              session_id: sessionId,
              mood,
              note: note.trim() || null,
              phase,
            })
            .select()
            .single();
          if (error) throw error;
          return data;
        },
        "fast_check_ins",
        "insert",
        { user_id: userId, session_id: sessionId, mood, note: note.trim() || null, phase },
        isOffline,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fast_check_ins", sessionId] });
    },
  });

  const deleteCheckInMutation = useMutation({
    mutationFn: async (id: string) => {
      return withOfflineFallback(
        async () => {
          const { error } = await supabase
            .from("fast_check_ins")
            .delete()
            .eq("id", id);
          if (error) throw error;
          return id;
        },
        "fast_check_ins",
        "delete",
        { id },
        isOffline,
      );
    },
    onSuccess: (_data, id) => {
      queryClient.setQueryData<FastCheckIn[]>(["fast_check_ins", sessionId], (old) =>
        (old ?? []).filter((c) => c.id !== id)
      );
    },
  });

  return {
    checkIns,
    addCheckIn: addCheckInMutation.mutateAsync,
    deleteCheckIn: deleteCheckInMutation.mutateAsync,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["fast_check_ins", sessionId] }),
  };
}

export function useSessionCheckIns(_userId: string | undefined, sessionId: string | null) {
  const { data: checkIns = [] } = useQuery({
    queryKey: ["fast_check_ins", sessionId],
    queryFn: async (): Promise<FastCheckIn[]> => {
      if (!sessionId) return [];
      const { data } = await supabase
        .from("fast_check_ins")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5,
  });

  return { checkIns };
}
