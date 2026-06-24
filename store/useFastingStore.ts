import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  restoreTimer: () => Promise<void>;
};

const TIMER_KEY = "@fasttrack_timer";

async function persistTimer(state: {
  timerState: TimerState;
  sessionId: string | null;
  startTime: string | null;
}) {
  try {
    await AsyncStorage.setItem(TIMER_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to persist timer:", e);
  }
}

async function clearPersistedTimer() {
  try {
    await AsyncStorage.removeItem(TIMER_KEY);
  } catch (e) {
    console.error("Failed to clear timer:", e);
  }
}

export const useFastingStore = create<FastingStore>((set, get) => ({
  timerState: "idle",
  sessionId: null,
  startTime: null,
  fastingHours: 16,
  eatingHours: 8,

  setTimerState: (timerState) => {
    set({ timerState });
    const { sessionId, startTime } = get();
    persistTimer({ timerState, sessionId, startTime });
  },
  setSessionId: (sessionId) => {
    set({ sessionId });
    const { timerState, startTime } = get();
    persistTimer({ timerState, sessionId, startTime });
  },
  setStartTime: (startTime) => {
    set({ startTime });
    const { timerState, sessionId } = get();
    persistTimer({ timerState, sessionId, startTime });
  },
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

    const newState = { timerState: "running" as TimerState, sessionId: data.id, startTime: now };
    set(newState);
    persistTimer(newState);

    return data.id;
  },

  endFast: async (sessionId: string) => {
    const now = new Date().toISOString();
    await supabase
      .from("fasting_sessions")
      .update({ end_time: now, status: "completed" })
      .eq("id", sessionId);

    const newState = { timerState: "idle" as TimerState, sessionId: null, startTime: null };
    set(newState);
    clearPersistedTimer();
  },

  breakFast: async (sessionId: string) => {
    await supabase
      .from("fasting_sessions")
      .update({ status: "eating" })
      .eq("id", sessionId);

    set({ timerState: "paused" });
  },

  reset: () => {
    const newState = { timerState: "idle" as TimerState, sessionId: null, startTime: null };
    set(newState);
    clearPersistedTimer();
  },

  restoreTimer: async () => {
    try {
      const raw = await AsyncStorage.getItem(TIMER_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.sessionId && parsed.startTime) {
        set({
          timerState: parsed.timerState ?? "idle",
          sessionId: parsed.sessionId,
          startTime: parsed.startTime,
        });
      }
    } catch (e) {
      console.error("Failed to restore timer:", e);
    }
  },
}));
