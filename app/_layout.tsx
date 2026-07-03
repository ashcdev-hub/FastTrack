import "../global.css";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGoalStore } from "@/store/useGoalStore";
import { useFastingStore } from "@/store/useFastingStore";
import { useFoodLogStore } from "@/store/useFoodLogStore";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useThemeStore } from "@/lib/theme-store";
import { useTrackerStore } from "@/store/useTrackerStore";
import { applyTheme } from "@/lib/dark-mode";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import { setupNotifications } from "@/lib/notifications";
import { View, ActivityIndicator } from "react-native";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useOfflineQueueProcessor } from "@/hooks/useOfflineQueueProcessor";

const CACHE_KEY = "fasttrack_query_cache";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});

const MAX_CACHE_AGE = 1000 * 60 * 60 * 24;

async function hydrateQueryCache() {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const { queries } = JSON.parse(raw);
    const now = Date.now();
    for (const q of queries) {
      if (
        q.queryKey &&
        q.data !== undefined &&
        q.data !== null &&
        q.dataUpdatedAt &&
        now - q.dataUpdatedAt < MAX_CACHE_AGE
      ) {
        queryClient.setQueryData(q.queryKey, q.data, {
          updatedAt: q.dataUpdatedAt,
        });
      }
    }
  } catch (e) {
    console.error("Failed to hydrate query cache:", e);
  }
}

void hydrateQueryCache();

let persistTimer: ReturnType<typeof setTimeout> | null = null;
const persistCache = () => {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll().map((q) => ({
        queryKey: q.queryKey,
        data: q.state.data,
        dataUpdatedAt: q.state.dataUpdatedAt,
      }));
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ queries }));
    } catch {}
  }, 1000);
};
queryClient.getQueryCache().subscribe(persistCache);

function OfflineQueueProcessor() {
  useOfflineQueueProcessor();
  return null;
}

function InnerLayout() {
  const { user } = useAuth();
  const loadGoals = useGoalStore((s) => s.loadGoals);
  const setFastingHours = useFastingStore((s) => s.setFastingHours);
  const setEatingHours = useFastingStore((s) => s.setEatingHours);
  const { profile, loading: profileLoading } = useProfile(user?.id ?? null);
  const { theme, loaded: themeLoaded, loadTheme, setResolvedTheme, mode } = useThemeStore();
  const systemScheme = useColorScheme();
  const { setFromProfile, loadTrackers } = useTrackerStore();
  const accent = getAccentColors(theme);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    Inter_800ExtraBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const [fontTimeout, setFontTimeout] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      console.log("Font loading timed out after 10s");
      setFontTimeout(true);
    }, 10000);
    return () => clearTimeout(t);
  }, []);
  if (fontError) console.error("Font loading error:", fontError);
  const ready = fontsLoaded || fontTimeout;

  useEffect(() => {
    loadGoals();
    loadTheme();
    setupNotifications();
    useFastingStore.getState().restoreTimer();
    useFoodLogStore.getState().loadFromStorage();
    loadTrackers();
  }, []);

  useEffect(() => {
    const resolved = mode === "system" ? (systemScheme ?? "dark") : mode;
    setResolvedTheme(resolved);
  }, [mode, systemScheme, setResolvedTheme]);

  useEffect(() => {
    if (themeLoaded) {
      applyTheme(theme);
    }
  }, [theme, themeLoaded]);

  useEffect(() => {
    if (profile && !profileLoading) {
      setFastingHours(profile.fasting_hours ?? 16);
      setEatingHours(profile.eating_hours ?? 8);
      if (profile.enabled_trackers) {
        setFromProfile(profile.enabled_trackers);
      }
    }
  }, [profile, profileLoading, setFastingHours, setEatingHours, setFromProfile]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme === "dark" ? "#0C0C0E" : "#F6F4EF" }}>
        <ActivityIndicator size="large" color={accent.lime} />
      </View>
    );
  }

  return (
    <>
      <OfflineQueueProcessor />
      <OfflineBanner />
      <ErrorBoundary onError={(error, stack) => {
        console.error("[ErrorBoundary]", error, "\nComponent stack:", stack);
      }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: getThemeColors(theme).bg },
          }}
        />
      </ErrorBoundary>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <InnerLayout />
    </QueryClientProvider>
  );
}
