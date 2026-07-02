import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FastingSession } from "@/lib/types";
import { useConnectivity } from "@/hooks/useConnectivity";
import { withOfflineFallback } from "@/lib/offline-mutation";

export function useFastingSession(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { isOffline } = useConnectivity();

  const { data: session = null, isLoading: loading } = useQuery({
    queryKey: ["fasting_session", "active", userId],
    queryFn: async (): Promise<FastingSession | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("fasting_sessions")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["fasting", "eating"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116" && error.code !== "42501") {
        console.error("Error fetching fasting session:", error);
      }

      return data ?? null;
    },
    enabled: !!userId,
    staleTime: 1000 * 30,
  });

  const { data: pastSessions = [] } = useQuery({
    queryKey: ["fasting_sessions", "completed", userId],
    queryFn: async (): Promise<FastingSession[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("fasting_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("end_time", { ascending: false })
        .limit(30);

      if (error) return [];
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });

  // Derived state
  const completedFasts = pastSessions.filter((s) => s.status === "completed").length;
  const streak = calculateStreak(pastSessions);

  // Realtime subscription
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `fasting-sessions-${userId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fasting_sessions",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["fasting_session", "active", userId] });
          queryClient.invalidateQueries({ queryKey: ["fasting_sessions", "completed", userId] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, queryClient]);

  const startFastMutation = useMutation({
    mutationFn: async ({ startTime, schedule }: { startTime?: Date; schedule?: string }) => {
      if (!userId) throw new Error("No user");
      const start = startTime ?? new Date();
      return withOfflineFallback(
        async () => {
          const { data, error } = await supabase
            .from("fasting_sessions")
            .insert({
              user_id: userId,
              start_time: start.toISOString(),
              status: "fasting",
              fasting_schedule: schedule ?? null,
            })
            .select()
            .single();
          if (error) throw error;
          return data;
        },
        "fasting_sessions",
        "insert",
        { user_id: userId, start_time: start.toISOString(), status: "fasting", fasting_schedule: schedule ?? null },
        isOffline,
      );
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["fasting_session", "active", userId], data);
    },
  });

  const endFastMutation = useMutation({
    mutationFn: async ({ sessionId, endTime }: { sessionId: string; endTime?: Date }) => {
      const end = endTime ?? new Date();
      const durationMinutes = session?.start_time
        ? Math.floor((end.getTime() - new Date(session.start_time).getTime()) / 60000)
        : null;

      return withOfflineFallback(
        async () => {
          const { data, error } = await supabase
            .from("fasting_sessions")
            .update({
              end_time: end.toISOString(),
              status: "completed",
              fasting_duration_minutes: durationMinutes,
            })
            .eq("id", sessionId)
            .select()
            .single();
          if (error) throw error;
          return data;
        },
        "fasting_sessions",
        "update",
        { id: sessionId, end_time: end.toISOString(), status: "completed", fasting_duration_minutes: durationMinutes },
        isOffline,
      );
    },
    onSuccess: () => {
      queryClient.setQueryData(["fasting_session", "active", userId], null);
      queryClient.invalidateQueries({ queryKey: ["fasting_sessions", "completed", userId] });
    },
  });

  const breakFastMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const now = new Date().toISOString();
      return withOfflineFallback(
        async () => {
          const { data, error } = await supabase
            .from("fasting_sessions")
            .update({ status: "eating", end_time: now })
            .eq("id", sessionId)
            .select()
            .single();
          if (error) throw error;
          return data;
        },
        "fasting_sessions",
        "update",
        { id: sessionId, status: "eating", end_time: now },
        isOffline,
      );
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["fasting_session", "active", userId], data);
    },
  });

  const updateStartTimeMutation = useMutation({
    mutationFn: async ({ sessionId, newStartTime }: { sessionId: string; newStartTime: Date }) => {
      return withOfflineFallback(
        async () => {
          const { data, error } = await supabase
            .from("fasting_sessions")
            .update({ start_time: newStartTime.toISOString() })
            .eq("id", sessionId)
            .select()
            .single();
          if (error) throw error;
          return data;
        },
        "fasting_sessions",
        "update",
        { id: sessionId, start_time: newStartTime.toISOString() },
        isOffline,
      );
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["fasting_session", "active", userId], data);
    },
  });

  const discardFastMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const now = new Date().toISOString();
      return withOfflineFallback(
        async () => {
          const { data, error } = await supabase
            .from("fasting_sessions")
            .update({ status: "broken", end_time: now })
            .eq("id", sessionId)
            .select()
            .single();
          if (error) throw error;
          return data;
        },
        "fasting_sessions",
        "update",
        { id: sessionId, status: "broken", end_time: now },
        isOffline,
      );
    },
    onSuccess: () => {
      queryClient.setQueryData(["fasting_session", "active", userId], null);
      queryClient.invalidateQueries({ queryKey: ["fasting_sessions", "completed", userId] });
    },
  });

  const deleteFastMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return withOfflineFallback(
        async () => {
          const { error } = await supabase
            .from("fasting_sessions")
            .delete()
            .eq("id", sessionId);
          if (error) throw error;
          return sessionId;
        },
        "fasting_sessions",
        "delete",
        { id: sessionId },
        isOffline,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fasting_sessions", "completed", userId] });
    },
  });

  return {
    session,
    loading,
    pastSessions,
    streak,
    completedFasts,
    startFast: (startTime?: Date, schedule?: string) =>
      startFastMutation.mutateAsync({ startTime, schedule }),
    endFast: (sessionId: string, endTime?: Date) =>
      endFastMutation.mutateAsync({ sessionId, endTime }),
    breakFast: breakFastMutation.mutateAsync,
    discardFast: discardFastMutation.mutateAsync,
    deleteFast: deleteFastMutation.mutateAsync,
    updateStartTime: (sessionId: string, newStartTime: Date) =>
      updateStartTimeMutation.mutateAsync({ sessionId, newStartTime }),
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ["fasting_session", "active", userId] });
      queryClient.invalidateQueries({ queryKey: ["fasting_sessions", "completed", userId] });
    },
  };
}

function calculateStreak(sessions: FastingSession[]): number {
  if (sessions.length === 0) return 0;

  const byDay = new Map<string, FastingSession>();
  for (const s of sessions) {
    if (!s.end_time) continue;
    const d = new Date(s.end_time);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const existing = byDay.get(key);
    if (!existing || (s.status === "completed" && existing.status !== "completed")) {
      byDay.set(key, s);
    }
  }

  const uniqueDays = [...byDay.values()].sort(
    (a, b) => new Date(b.end_time!).getTime() - new Date(a.end_time!).getTime()
  );

  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < uniqueDays.length; i++) {
    const sessionDate = new Date(uniqueDays[i].end_time!);
    sessionDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (sessionDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else if (sessionDate.getTime() < expectedDate.getTime()) {
      break;
    }
  }

  return currentStreak;
}
