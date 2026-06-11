import { create } from "zustand";
import { supabase } from "@/lib/supabase";

type TimerState = "idle" | "running" | "paused";

type FastingStore = {
  timerState: TimerState;
  sessionId: string | null;
  startTime: string | null;
  fastingHours: number;
  eatingHours: number;

  setTimerState: (state: TimerState) => void;
  setSessionId: (id: string | null) => void;
  setStartTime: (time: string | null) => void;
  setFastingHours: (hours: number) => void;
  setEatingHours: (hours: number) => void;

  startFast: (userId: string) => Promise<string | null>;
  endFast: (sessionId: string) => Promise<void>;
  breakFast: (sessionId: string) => Promise<void>;
  reset: () => void;
};

export const useFastingStore = create<FastingStore>((set) => ({
  timerState: "idle",
  sessionId: null,
  startTime: null,
  fastingHours: 16,
  eatingHours: 8,

  setTimerState: (timerState) => set({ timerState }),
  setSessionId: (sessionId) => set({ sessionId }),
  setStartTime: (startTime) => set({ startTime }),
  setFastingHours: (fastingHours) => set({ fastingHours }),
  setEatingHours: (eatingHours) => set({ eatingHours }),

  startFast: async (userId: string) => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("fasting_sessions")
      .insert({ user_id: userId, start_time: now, status: "fasting" })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to start fast:", error);
      return null;
    }

    set({
      timerState: "running",
      sessionId: data.id,
      startTime: now,
    });

    return data.id;
  },

  endFast: async (sessionId: string) => {
    const now = new Date().toISOString();
    await supabase
      .from("fasting_sessions")
      .update({ end_time: now, status: "completed" })
      .eq("id", sessionId);

    set({ timerState: "idle", sessionId: null, startTime: null });
  },

  breakFast: async (sessionId: string) => {
    await supabase
      .from("fasting_sessions")
      .update({ status: "eating" })
      .eq("id", sessionId);

    set({ timerState: "paused" });
  },

  reset: () =>
    set({
      timerState: "idle",
      sessionId: null,
      startTime: null,
    }),
}));
