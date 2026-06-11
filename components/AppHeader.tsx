import React from "react";
import { Pressable, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Settings02Icon from "@hugeicons/core-free-icons/dist/esm/Settings02Icon";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";

type AppHeaderProps = {
  title: string;
};

export function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  return (
    <View className="flex-row justify-between items-center mb-8">
      <Text
        style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }}
        className="text-3xl"
      >
        {title}
      </Text>
      <Pressable
        onPress={() => router.push("/settings")}
        className="p-2.5 rounded-xl"
        style={{ backgroundColor: c.buttonBg }}
      >
        <HugeiconsIcon
          icon={Settings02Icon}
          size={22}
          color={c.textSecondary}
          strokeWidth={1.5}
        />
      </Pressable>
    </View>
  );
}
