import React, { useEffect } from "react";
import { router, Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { useAuth } from "@/hooks/useAuth";

const TAB_CONFIG: Record<string, { label: string; active: keyof typeof MaterialCommunityIcons.glyphMap; inactive: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  index: { label: "Home", active: "view-dashboard", inactive: "view-dashboard-outline" },
  fast: { label: "Fast", active: "timer", inactive: "timer-outline" },
  workouts: { label: "Workout", active: "dumbbell", inactive: "dumbbell" },
  "log-food": { label: "Food", active: "food-apple", inactive: "food-apple-outline" },
  profile: { label: "Profile", active: "account-circle", inactive: "account-circle-outline" },
};

export default function TabLayout() {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const { session, loading } = useAuth();

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
          height: 85,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: ACCENT.lime,
        tabBarInactiveTintColor: c.tabBarInactive,
        tabBarLabelStyle: {
          fontFamily: "SpaceGrotesk_700Bold",
          fontSize: 10,
          letterSpacing: 0.5,
          marginTop: 2,
        },
      }}
    >
      {Object.entries(TAB_CONFIG).map(([name, config]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
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
      ))}
    </Tabs>
  );
}
