import React, { useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useMyMeals } from "@/hooks/useMyMeals";
import { MyMealsManagerModal } from "@/components/MyMealsManagerModal";
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
  const { meals: myMeals } = useMyMeals(user?.id ?? undefined);
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const { toast } = useToast();
  const { expand } = useLocalSearchParams<{ expand?: string }>();

  const [showMyMealsManager, setShowMyMealsManager] = useState(false);

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

        <View className="mb-4">
          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>
            MY DATA
          </Text>
          <Pressable onPress={() => setShowMyMealsManager(true)} className="rounded-xl p-5 flex-row items-center justify-between" style={{ backgroundColor: c.cardBgAlt }}>
            <View className="flex-row items-center gap-3">
              <View className="rounded-lg items-center justify-center" style={{ width: 36, height: 36, backgroundColor: ACCENT.cyanBg }}>
                <MaterialCommunityIcons name="bookmark-outline" size={18} color={ACCENT.cyan} />
              </View>
              <View>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 15 }}>My Meals</Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>{myMeals.length} saved</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={c.textMuted} />
          </Pressable>
        </View>

        <Pressable
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/login");
          }}
          className="rounded-xl py-4 mb-section-gap"
          style={{ backgroundColor: ACCENT.roseBg, borderWidth: 1, borderColor: ACCENT.roseBorder }}
        >
          <Text style={{ color: ACCENT.rose, fontFamily: "Inter_700Bold", textAlign: "center" }}>
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>

      <MyMealsManagerModal visible={showMyMealsManager} userId={user?.id ?? undefined} onClose={() => setShowMyMealsManager(false)} />
    </SafeAreaView>
  );
}
