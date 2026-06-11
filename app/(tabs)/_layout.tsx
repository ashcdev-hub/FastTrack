import React from "react";
import { Tabs } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Timer01Icon from "@hugeicons/core-free-icons/dist/esm/Timer01Icon";
import Dumbbell01Icon from "@hugeicons/core-free-icons/dist/esm/Dumbbell01Icon";
import SaladIcon from "@hugeicons/core-free-icons/dist/esm/SaladIcon";
import UserCircleIcon from "@hugeicons/core-free-icons/dist/esm/UserCircleIcon";
import { useThemeStore } from "@/lib/theme-store";

export default function TabLayout() {
  const { theme } = useThemeStore();

  const tabBarBg = theme === "dark" ? "#0F172A" : "#FFFFFF";
  const tabBarBorder = theme === "dark" ? "#1E293B" : "#E5E7EB";
  const tabBarActive = "#3B82F6";
  const tabBarInactive = theme === "dark" ? "#64748B" : "#9CA3AF";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: tabBarBorder,
          height: 85,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: tabBarActive,
        tabBarInactiveTintColor: tabBarInactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Fast",
          tabBarIcon: ({ color }) => (
            <HugeiconsIcon icon={Timer01Icon} size={24} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Workouts",
          tabBarIcon: ({ color }) => (
            <HugeiconsIcon icon={Dumbbell01Icon} size={24} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="log-food"
        options={{
          title: "Log Food",
          tabBarIcon: ({ color }) => (
            <HugeiconsIcon icon={SaladIcon} size={24} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Me",
          tabBarIcon: ({ color }) => (
            <HugeiconsIcon icon={UserCircleIcon} size={24} color={color} strokeWidth={1.5} />
          ),
        }}
      />
    </Tabs>
  );
}
