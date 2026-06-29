import React, { useEffect } from "react";
import { Platform } from "react-native";
import { router, Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import { useAuth } from "@/hooks/useAuth";
import { useTrackerStore } from "@/store/useTrackerStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TrackerId } from "@/lib/types";

const TAB_CONFIG: Record<string, { label: string; active: keyof typeof MaterialCommunityIcons.glyphMap; inactive: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  index: { label: "Home", active: "view-dashboard", inactive: "view-dashboard-outline" },
  fast: { label: "Fast", active: "timer", inactive: "timer-outline" },
  workouts: { label: "Workout", active: "dumbbell", inactive: "dumbbell" },
  "log-food": { label: "Food", active: "food-apple", inactive: "food-apple-outline" },
  profile: { label: "Profile", active: "account-circle", inactive: "account-circle-outline" },
};

const TAB_ORDER = ["index", "fast", "workouts", "log-food", "profile"];

const TAB_TRACKER: Record<string, TrackerId | null> = {
  index: null,
  fast: "fasting",
  workouts: "workouts",
  "log-food": "food",
  profile: null,
};

export default function TabLayout() {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const { session, loading } = useAuth();
  const { isEnabled, loaded: trackersLoaded } = useTrackerStore();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === "android" ? insets.bottom : 0;

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/(auth)/login");
    }
  }, [session, loading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.tabBarBg,
          borderTopColor: c.tabBarBorder,
          borderTopWidth: 1,
          height: 85 + bottomInset,
          paddingTop: 8,
          paddingBottom: 28 + bottomInset,
        },
        tabBarActiveTintColor: accent.lime,
        tabBarInactiveTintColor: c.tabBarInactive,
        tabBarLabelStyle: {
          fontFamily: "SpaceGrotesk_700Bold",
          fontSize: 10,
          letterSpacing: 0.5,
          marginTop: 2,
        },
      }}
    >
      {TAB_ORDER.map((name) => {
        const config = TAB_CONFIG[name];
        const tracker = TAB_TRACKER[name];
        const visible = tracker === null || !trackersLoaded || isEnabled(tracker);
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              href: visible ? undefined : null,
              title: config.label,
              tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons
                  name={focused ? config.active : config.inactive}
                  size={22}
                  color={color}
                />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
