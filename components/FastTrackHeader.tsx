import React from "react";
import { View, Text, Image } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, getAccentColors } from "@/lib/theme-colors";

export function FastTrackHeader() {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);

  return (
    <View style={{ paddingTop: 8 }}>
      <View className="flex-row justify-between items-center" style={{ height: 44, paddingHorizontal: 20 }}>
        <View className="flex-row items-center gap-2">
          <Image source={require("../assets/icon.png")} style={{ width: 22, height: 22, borderRadius: 5 }} />
          <Text
            style={{
              color: accent.lime,
              fontFamily: "Inter_800ExtraBold",
              fontSize: 22,
              letterSpacing: -0.5,
            }}
          >
            FastTrack
          </Text>
        </View>
      </View>
    </View>
  );
}
