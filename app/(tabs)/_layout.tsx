import React, { useEffect } from "react";
import { router, Tabs } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Timer01Icon from "@hugeicons/core-free-icons/dist/esm/Timer01Icon";
import Dumbbell01Icon from "@hugeicons/core-free-icons/dist/esm/Dumbbell01Icon";
import SpoonAndForkIcon from "@hugeicons/core-free-icons/dist/esm/SpoonAndForkIcon";
import UserCircleIcon from "@hugeicons/core-free-icons/dist/esm/UserCircleIcon";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { useAuth } from "@/hooks/useAuth";

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
        tabBarActiveTintColor: ACCENT.mint,
        tabBarInactiveTintColor: c.tabBarInactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Fast",
          tabBarIcon: ({ color }) => (
            <HugeiconsIcon icon={Timer01Icon} size={22} color={color} strokeWidth={1.5} />
          ),
          tabBarLabelStyle: {
            fontFamily: "PlusJakartaSans_600SemiBold",
            fontSize: 11,
          },
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Workouts",
          tabBarIcon: ({ color }) => (
            <HugeiconsIcon icon={Dumbbell01Icon} size={22} color={color} strokeWidth={1.5} />
          ),
          tabBarLabelStyle: {
            fontFamily: "PlusJakartaSans_600SemiBold",
            fontSize: 11,
          },
        }}
      />
      <Tabs.Screen
        name="log-food"
        options={{
          title: "Log",
          tabBarIcon: ({ color }) => (
            <HugeiconsIcon icon={SpoonAndForkIcon} size={22} color={color} strokeWidth={1.5} />
          ),
          tabBarLabelStyle: {
            fontFamily: "PlusJakartaSans_600SemiBold",
            fontSize: 11,
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Me",
          tabBarIcon: ({ color }) => (
            <HugeiconsIcon icon={UserCircleIcon} size={22} color={color} strokeWidth={1.5} />
          ),
          tabBarLabelStyle: {
            fontFamily: "PlusJakartaSans_600SemiBold",
            fontSize: 11,
          },
        }}
      />
    </Tabs>
  );
}
