import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

type GoalStore = {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  waterGoalMl: number;
  loaded: boolean;

  loadGoals: () => Promise<void>;
  updateGoals: (goals: Partial<Omit<GoalStore, "loaded" | "loadGoals" | "updateGoals">>) => Promise<void>;
};

const GOALS_KEY = "@fasttrack_goals";

const defaults = {
  dailyCalories: 2000,
  dailyProtein: 150,
  dailyCarbs: 200,
  dailyFat: 65,
  waterGoalMl: 2500,
};

export const useGoalStore = create<GoalStore>((set, get) => ({
  ...defaults,
  loaded: false,

  loadGoals: async () => {
    try {
      const raw = await AsyncStorage.getItem(GOALS_KEY);
      if (raw) {
        set({ ...JSON.parse(raw), loaded: true });
      } else {
        set({ ...defaults, loaded: true });
      }
    } catch {
      set({ ...defaults, loaded: true });
    }
  },

  updateGoals: async (goals) => {
    const current = get();
    const updated = { ...current, ...goals };
    set(goals);
    try {
      const { loadGoals, updateGoals, ...toStore } = updated;
      await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.error("Failed to save goals:", e);
    }
  },
}));
