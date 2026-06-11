import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { FastCheckIn } from "@/lib/types";

export function useFastCheckIns(userId: string | undefined, sessionId: string | null) {
  const [checkIns, setCheckIns] = useState<FastCheckIn[]>([]);

  const fetchCheckIns = useCallback(async () => {
    if (!userId || !sessionId) {
      setCheckIns([]);
      return;
    }

    const { data } = await supabase
      .from("fast_check_ins")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    setCheckIns(data ?? []);
  }, [userId, sessionId]);

  useEffect(() => {
    fetchCheckIns();
  }, [fetchCheckIns]);

  const addCheckIn = async (mood: number, note: string, phase: string) => {
    if (!userId || !sessionId) return { error: new Error("No user or session") };

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

    if (!error) {
      setCheckIns((prev) => [...prev, data]);
    }
    return { data, error };
  };

  const deleteCheckIn = async (id: string) => {
    const { error } = await supabase
      .from("fast_check_ins")
      .delete()
      .eq("id", id);

    if (!error) {
      setCheckIns((prev) => prev.filter((c) => c.id !== id));
    }
    return { error };
  };

  return { checkIns, addCheckIn, deleteCheckIn, refetch: fetchCheckIns };
}

export function useSessionCheckIns(_userId: string | undefined, sessionId: string | null) {
  const [checkIns, setCheckIns] = useState<FastCheckIn[]>([]);

  useEffect(() => {
    if (!sessionId) {
      setCheckIns([]);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("fast_check_ins")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      setCheckIns(data ?? []);
    };

    fetch();
  }, [sessionId]);

  return { checkIns };
}
