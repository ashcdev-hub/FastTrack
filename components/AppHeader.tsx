import React from "react";
import { Pressable, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Settings02Icon from "@hugeicons/core-free-icons/dist/esm/Settings02Icon";
import { useThemeStore } from "@/lib/theme-store";

type AppHeaderProps = {
  title: string;
};

export function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter();
  const { theme } = useThemeStore();

  return (
    <View className="flex-row justify-between items-center mb-6">
      <Text
        style={{ color: theme === "dark" ? "#FFFFFF" : "#111827" }}
        className="text-3xl font-bold"
      >
        {title}
      </Text>
      <Pressable
        onPress={() => router.push("/settings")}
        className="p-2 rounded-xl"
        style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}
      >
        <HugeiconsIcon
          icon={Settings02Icon}
          size={22}
          color={theme === "dark" ? "#FFFFFF" : "#374151"}
          strokeWidth={1.5}
        />
      </Pressable>
    </View>
  );
}
