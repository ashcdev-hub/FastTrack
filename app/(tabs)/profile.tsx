import React, { useRef } from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import { SettingsPanel } from "@/components/SettingsPanel";
import { router, useLocalSearchParams } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id ?? null);
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const { toast } = useToast();
  const { expand } = useLocalSearchParams<{ expand?: string }>();

  const getFirstName = (): string => {
    if (profile?.display_name) return profile.display_name.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef as any);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />

      {/* Fixed Top App Bar */}
      <View style={{ backgroundColor: c.tabBarBg, borderBottomWidth: 1, borderBottomColor: "rgba(53,53,52,0.2)", paddingTop: 8 }}>
        <View className="flex-row items-center" style={{ height: 44, paddingHorizontal: 20 }}>
          <View className="flex-row items-center gap-2">
            <Image source={require("../../assets/icon.png")} style={{ width: 22, height: 22, borderRadius: 5 }} />
            <Text style={{ color: ACCENT.lime, fontFamily: "Inter_800ExtraBold", fontSize: 22, letterSpacing: -0.5 }}>FastTrack</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 85, paddingHorizontal: 20, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.3, marginBottom: 24 }}>
          {getFirstName()}
        </Text>

        <View className="pt-4">
          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>
            SETTINGS
          </Text>
          <SettingsPanel key={expand ?? 'default'} userId={user?.id ?? null} initialExpand={expand} />
        </View>

        <Pressable
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/login");
          }}
          className="rounded-xl py-4 mt-4"
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
