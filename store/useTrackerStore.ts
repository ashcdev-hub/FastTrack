import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TrackerId } from "@/lib/types";

const TRACKERS_KEY = "@fasttrack_enabled_trackers";

export const DEFAULT_TRACKERS: Record<TrackerId, boolean> = {
  fasting: true,
  workouts: true,
  food: true,
  period: false,
};

type TrackerStore = {
  enabled: Record<TrackerId, boolean>;
  loaded: boolean;
  loadTrackers: () => Promise<void>;
  setEnabled: (id: TrackerId, enabled: boolean) => Promise<void>;
  isEnabled: (id: TrackerId) => boolean;
  setFromProfile: (trackers: Record<TrackerId, boolean>) => void;
};

export const useTrackerStore = create<TrackerStore>((set, get) => ({
  enabled: { ...DEFAULT_TRACKERS },
  loaded: false,

  loadTrackers: async () => {
    try {
      const saved = await AsyncStorage.getItem(TRACKERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        set({ enabled: { ...DEFAULT_TRACKERS, ...parsed }, loaded: true });
      } else {
        set({ enabled: { ...DEFAULT_TRACKERS }, loaded: true });
      }
    } catch {
      set({ enabled: { ...DEFAULT_TRACKERS }, loaded: true });
    }
  },

  setEnabled: async (id, value) => {
    const current = get().enabled;
    const next = { ...current, [id]: value };
    set({ enabled: next });
    try {
      await AsyncStorage.setItem(TRACKERS_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to save tracker prefs:", e);
    }
  },

  isEnabled: (id) => {
    return get().enabled[id] ?? DEFAULT_TRACKERS[id] ?? false;
  },

  setFromProfile: (trackers) => {
    set({ enabled: { ...DEFAULT_TRACKERS, ...trackers }, loaded: true });
  },
}));
