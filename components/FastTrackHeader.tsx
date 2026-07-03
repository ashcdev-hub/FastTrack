import React, { useEffect } from "react";
import { View, Text, Image } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from "react-native-reanimated";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, getAccentColors } from "@/lib/theme-colors";

export function FastTrackHeader() {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);

  const breathe = useSharedValue(1);
  const wordmarkOpacity = useSharedValue(1);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
  }));

  return (
    <View style={{ backgroundColor: c.tabBarBg, borderBottomWidth: 1, borderBottomColor: c.tabBarBorder, paddingTop: 8 }}>
      <View className="flex-row justify-between items-center" style={{ height: 44, paddingHorizontal: 20 }}>
        <Animated.View className="flex-row items-center gap-2" style={logoStyle}>
          <Image source={require("../assets/icon.png")} style={{ width: 22, height: 22, borderRadius: 5 }} />
          <Animated.Text
            style={{
              color: accent.lime,
              fontFamily: "Inter_800ExtraBold",
              fontSize: 22,
              letterSpacing: -0.5,
            }}
          >
            FastTrack
          </Animated.Text>
        </Animated.View>
      </View>
    </View>
  );
}
