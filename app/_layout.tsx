import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_400Regular,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useGoalStore } from "@/store/useGoalStore";
import { useFastingStore } from "@/store/useFastingStore";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useThemeStore } from "@/lib/theme-store";
import { applyTheme } from "@/lib/dark-mode";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { setupNotifications } from "@/lib/notifications";
import { View, ActivityIndicator } from "react-native";

const queryClient = new QueryClient();

export default function RootLayout() {
  const { user } = useAuth();
  const loadGoals = useGoalStore((s) => s.loadGoals);
  const setFastingHours = useFastingStore((s) => s.setFastingHours);
  const setEatingHours = useFastingStore((s) => s.setEatingHours);
  const { profile, loading: profileLoading } = useProfile(user?.id ?? null);
  const { theme, loaded: themeLoaded, loadTheme } = useThemeStore();

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_700Bold,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_400Regular,
  });

  useEffect(() => {
    loadGoals();
    loadTheme();
    setupNotifications();
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

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme === "dark" ? "#0C0C0E" : "#F6F4EF" }}>
        <ActivityIndicator size="large" color={ACCENT.mint} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: getThemeColors(theme).bg },
        }}
      />
    </QueryClientProvider>
  );
}
