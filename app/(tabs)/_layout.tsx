import React from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Timer01Icon from "@hugeicons/core-free-icons/dist/esm/Timer01Icon";
import Dumbbell01Icon from "@hugeicons/core-free-icons/dist/esm/Dumbbell01Icon";
import SaladIcon from "@hugeicons/core-free-icons/dist/esm/SaladIcon";
import UserCircleIcon from "@hugeicons/core-free-icons/dist/esm/UserCircleIcon";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";

export default function TabLayout() {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopColor: "transparent",
          height: 80,
          paddingTop: 0,
          paddingBottom: 0,
          justifyContent: "center",
          position: "absolute",
          elevation: 0,
        },
        tabBarBackground: () => (
          <View
            style={[
              styles.tabBarContainer,
              {
                backgroundColor: theme === "dark" ? "rgba(22,22,24,0.95)" : "rgba(255,255,255,0.95)",
                borderColor: c.cardBorder,
                shadowColor: "#000",
              },
            ]}
          />
        ),
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
          title: "Log Food",
          tabBarIcon: ({ color }) => (
            <HugeiconsIcon icon={SaladIcon} size={22} color={color} strokeWidth={1.5} />
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

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 16,
    left: 24,
    right: 24,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
});
