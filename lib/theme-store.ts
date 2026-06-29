import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "dark" | "light" | "system";

type ThemeStore = {
  mode: ThemeMode;
  theme: "dark" | "light";
  loaded: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  setResolvedTheme: (theme: "dark" | "light") => void;
  loadTheme: () => Promise<void>;
};

const THEME_KEY = "@fasttrack_theme";

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: "dark",
  theme: "dark",
  loaded: false,

  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark" || saved === "system") {
        set({ mode: saved, theme: saved === "system" ? "dark" : saved, loaded: true });
      } else {
        set({ mode: "dark", theme: "dark", loaded: true });
      }
    } catch {
      set({ mode: "dark", theme: "dark", loaded: true });
    }
  },

  setMode: async (mode) => {
    set({ mode });
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
    } catch (e) {
      console.error("Failed to save theme:", e);
    }
  },

  setResolvedTheme: (theme) => {
    set({ theme });
  },
}));
