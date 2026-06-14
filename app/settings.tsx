import React from "react";
import { Pressable, View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import ArrowLeft01Icon from "@hugeicons/core-free-icons/dist/esm/ArrowLeft01Icon";
import { useAuth } from "@/hooks/useAuth";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { SettingsPanel } from "@/components/SettingsPanel";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      <ScrollView contentContainerClassName="px-6 py-8" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={() => router.back()}
            className="p-2 rounded-xl mr-3"
            style={{ backgroundColor: c.buttonBg }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={c.textSecondary} strokeWidth={1.5} />
          </Pressable>
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-3xl">
            Settings
          </Text>
        </View>
        <SettingsPanel userId={user?.id ?? null} />

        <Pressable
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/login");
          }}
          className="rounded-xl py-4 mt-4"
          style={{ backgroundColor: ACCENT.roseBg, borderWidth: 1, borderColor: ACCENT.roseBorder }}
        >
          <Text style={{ color: ACCENT.rose, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-center">
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
