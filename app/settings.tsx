import React from "react";
import { Pressable, View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
            className="p-2 rounded-lg mr-3"
            style={{ backgroundColor: c.buttonBg }}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={c.textSecondary} />
          </Pressable>
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 28 }}>
            Settings
          </Text>
        </View>
        <SettingsPanel userId={user?.id ?? null} />

        <Pressable
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/login");
          }}
          className="rounded-lg py-4 mt-4"
          style={{ backgroundColor: ACCENT.roseBg, borderWidth: 1, borderColor: ACCENT.roseBorder }}
        >
          <Text style={{ color: ACCENT.rose, fontFamily: "Inter_700Bold", textAlign: "center" }}>
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
