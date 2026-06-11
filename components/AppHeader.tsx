import React from "react";
import { Pressable, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Settings02Icon from "@hugeicons/core-free-icons/dist/esm/Settings02Icon";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";

type AppHeaderProps = {
  title: string;
  showLogo?: boolean;
  logoIcon?: any;
};

export function AppHeader({ title, showLogo = false, logoIcon }: AppHeaderProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  if (showLogo) {
    return (
      <View className="flex-row items-center justify-between mb-8">
        <View style={{ flex: 1, alignItems: "flex-start" }}>
          <Text
            style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }}
            className="text-3xl"
          >
            {title}
          </Text>
        </View>

        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: ACCENT.mintBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HugeiconsIcon icon={logoIcon} size={22} color={ACCENT.mint} strokeWidth={1.5} />
        </View>

        <View style={{ flex: 1, alignItems: "flex-end" }}>
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
      </View>
    );
  }

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
