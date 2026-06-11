import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { FastingSession } from "@/lib/types";

export function useFastingSession(userId: string | undefined) {
  const [session, setSession] = useState<FastingSession | null>(null);
  const [pastSessions, setPastSessions] = useState<FastingSession[]>([]);
  const [streak, setStreak] = useState(0);
  const [completedFasts, setCompletedFasts] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchActiveSession = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("fasting_sessions")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["fasting", "eating"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // Silently ignore auth/406 errors during session refresh
      if (error.code !== "42501") {
        console.error("Error fetching fasting session:", error);
      }
    }

    setSession(data ?? null);
    setLoading(false);
  }, [userId]);

  const fetchPastSessions = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("fasting_sessions")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "broken")
      .order("end_time", { ascending: false })
      .limit(30);

    if (error) {
      // Silently ignore auth/406 errors
      return;
    }

    setPastSessions(data ?? []);

    if (data) {
      const completed = data.filter((s) => s.status === "completed");
      setCompletedFasts(completed.length);
      calculateStreak(completed);
    }
  }, [userId]);

  const calculateStreak = (sessions: FastingSession[]) => {
    if (sessions.length === 0) {
      setStreak(0);
      return;
    }

    // Deduplicate: keep only one session per day, preferring "completed" status
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

    setStreak(currentStreak);
  };

  useEffect(() => {
    fetchActiveSession();
    fetchPastSessions();
  }, [fetchActiveSession, fetchPastSessions]);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Cleanup any existing channel first
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
          fetchActiveSession();
          fetchPastSessions();
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
  }, [userId, fetchActiveSession, fetchPastSessions]);

  const startFast = async (startTime: Date = new Date(), schedule?: string) => {
    if (!userId) return { error: new Error("No user") };

    const { data, error } = await supabase
      .from("fasting_sessions")
      .insert({
        user_id: userId,
        start_time: startTime.toISOString(),
        status: "fasting",
        fasting_schedule: schedule ?? null,
      })
      .select()
      .single();

    if (!error) setSession(data);
    return { data, error };
  };

  const endFast = async (sessionId: string, endTime: Date = new Date()) => {
    const durationMinutes = session?.start_time
      ? Math.floor((endTime.getTime() - new Date(session.start_time).getTime()) / 60000)
      : null;

    const { data, error } = await supabase
      .from("fasting_sessions")
      .update({
        end_time: endTime.toISOString(),
        status: "completed",
        fasting_duration_minutes: durationMinutes,
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (!error) {
      setSession(null);
      fetchPastSessions();
    }
    return { data, error };
  };

  const breakFast = async (sessionId: string) => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("fasting_sessions")
      .update({ status: "eating", end_time: now })
      .eq("id", sessionId)
      .select()
      .single();

    if (!error) setSession(data);
    return { data, error };
  };

  const deleteFast = async (sessionId: string) => {
    const { error } = await supabase
      .from("fasting_sessions")
      .delete()
      .eq("id", sessionId);

    if (!error) {
      const updated = pastSessions.filter((s) => s.id !== sessionId);
      setPastSessions(updated);
      const completed = updated.filter((s) => s.status === "completed");
      setCompletedFasts(completed.length);
    }
    return { error };
  };

  return {
    session,
    loading,
    pastSessions,
    streak,
    completedFasts,
    startFast,
    endFast,
    breakFast,
    deleteFast,
    refetch: fetchActiveSession,
  };
}
