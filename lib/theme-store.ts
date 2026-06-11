import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "dark" | "light";

type ThemeStore = {
  theme: Theme;
  loaded: boolean;
  setTheme: (theme: Theme) => Promise<void>;
  loadTheme: () => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const THEME_KEY = "@fasttrack_theme";

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: "dark",
  loaded: false,

  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") {
        set({ theme: saved, loaded: true });
      } else {
        set({ theme: "dark", loaded: true });
      }
    } catch {
      set({ theme: "dark", loaded: true });
    }
  },

  setTheme: async (theme) => {
    set({ theme });
    try {
      await AsyncStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.error("Failed to save theme:", e);
    }
  },

  toggleTheme: async () => {
    const current = get().theme;
    const next = current === "dark" ? "light" : "dark";
    await get().setTheme(next);
  },
}));
