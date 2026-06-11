import React from "react";
import { Pressable, View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import ArrowLeft01Icon from "@hugeicons/core-free-icons/dist/esm/ArrowLeft01Icon";
import { useAuth } from "@/hooks/useAuth";
import { useThemeStore } from "@/lib/theme-store";
import { SettingsPanel } from "@/components/SettingsPanel";

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useThemeStore();

  const bgColor = theme === "dark" ? "#0F172A" : "#F9FAFB";
  const textColor = theme === "dark" ? "#FFFFFF" : "#111827";

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: bgColor }}>
      <ScrollView contentContainerClassName="px-6 py-8">
        {/* Header with back button */}
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={() => router.back()}
            className="p-2 rounded-xl mr-3"
            style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={20}
              color={textColor}
              strokeWidth={1.5}
            />
          </Pressable>
          <Text style={{ color: textColor }} className="text-3xl font-bold">
            Settings
          </Text>
        </View>

        {/* Settings Panel */}
        <SettingsPanel userId={user?.id ?? null} />
      </ScrollView>
    </SafeAreaView>
  );
}
