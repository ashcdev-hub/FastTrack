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
          height: 88,
          paddingTop: 8,
          paddingBottom: 30,
          position: "absolute",
          elevation: 0,
        },
        tabBarBackground: () => (
          <View
            style={[
              styles.tabBarContainer,
              {
                backgroundColor: theme === "dark" ? "rgba(22,22,24,0.92)" : "rgba(255,255,255,0.92)",
                borderColor: c.cardBorder,
                shadowColor: theme === "dark" ? "#000" : "#000",
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
    bottom: 12,
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
});
