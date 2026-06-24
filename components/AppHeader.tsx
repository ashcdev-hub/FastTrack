import React from "react";
import { Pressable, View, Text, Image, ImageSourcePropType } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";

type AppHeaderProps = {
  title?: string;
  showLogo?: boolean;
  logoIcon?: any;
  logoImage?: ImageSourcePropType;
};

export function AppHeader({ title, showLogo = false, logoIcon, logoImage }: AppHeaderProps) {
  const router = useRouter();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  if (showLogo) {
    return (
      <View className="flex-row items-center justify-between mb-8">
        <View style={{ flex: 1, alignItems: "flex-start" }}>
          <Text
            style={{ color: c.text, fontFamily: "Inter_700Bold" }}
            className="text-3xl"
          >
            {title}
          </Text>
        </View>

        {logoImage ? (
          <Image
            source={logoImage}
            style={{ width: 144, height: 48 }}
            resizeMode="contain"
          />
        ) : (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: ACCENT.limeBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons name="circle-small" size={22} color={ACCENT.lime} />
          </View>
        )}

        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Pressable
            onPress={() => router.push("/settings")}
            className="p-2.5 rounded-xl"
            style={{ backgroundColor: c.buttonBg }}
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={22}
              color={c.textSecondary}
            />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row justify-between items-center mb-8">
      <Text
        style={{ color: c.text, fontFamily: "Inter_700Bold" }}
        className="text-3xl"
      >
        {title}
      </Text>
      <Pressable
        onPress={() => router.push("/settings")}
        className="p-2.5 rounded-xl"
        style={{ backgroundColor: c.buttonBg }}
      >
        <MaterialCommunityIcons
          name="cog-outline"
          size={22}
          color={c.textSecondary}
        />
      </Pressable>
    </View>
  );
}
