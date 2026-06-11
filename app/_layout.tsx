import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGoalStore } from "@/store/useGoalStore";
import { useFastingStore } from "@/store/useFastingStore";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useThemeStore } from "@/lib/theme-store";
import { applyTheme } from "@/lib/dark-mode";

const queryClient = new QueryClient();

export default function RootLayout() {
  const { user } = useAuth();
  const loadGoals = useGoalStore((s) => s.loadGoals);
  const setFastingHours = useFastingStore((s) => s.setFastingHours);
  const setEatingHours = useFastingStore((s) => s.setEatingHours);
  const { profile, loading: profileLoading } = useProfile(user?.id ?? null);
  const { theme, loaded: themeLoaded, loadTheme } = useThemeStore();

  useEffect(() => {
    loadGoals();
    loadTheme();
  }, []);

  useEffect(() => {
    if (themeLoaded) {
      applyTheme(theme);
    }
  }, [theme, themeLoaded]);

  // Populate fasting store from profile
  useEffect(() => {
    if (profile && !profileLoading) {
      setFastingHours(profile.fasting_hours ?? 16);
      setEatingHours(profile.eating_hours ?? 8);
    }
  }, [profile, profileLoading, setFastingHours, setEatingHours]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme === "dark" ? "#0F172A" : "#F9FAFB" },
        }}
      />
    </QueryClientProvider>
  );
}
