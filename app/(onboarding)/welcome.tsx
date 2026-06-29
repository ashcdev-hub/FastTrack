import React from "react";
import { Pressable, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);

  return (
    <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: c.bg }}>
      <View className="items-center mb-12">
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            backgroundColor: accent.limeBg,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <MaterialCommunityIcons name="timer-outline" size={48} color={accent.lime} />
        </View>

        <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-4xl text-center mb-3">
          FastTrack
        </Text>
        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-center text-lg leading-6">
          Your intermittent fasting{"\n"}companion
        </Text>
      </View>

      <View className="w-full">
        <Pressable
          onPress={() => router.push("/(onboarding)/profile")}
          className="rounded-xl py-4"
          style={{ backgroundColor: accent.lime }}
        >
          <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold" }} className="text-center text-lg">
            Get Started
          </Text>
        </Pressable>
      </View>

      {/* Step indicator */}
      <View className="flex-row gap-2 mt-10">
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent.lime }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
      </View>
    </View>
  );
}
