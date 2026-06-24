import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { useThemeStore } from "@/lib/theme-store";

const ONBOARDING_KEY = "@fasttrack_onboarding_done";

export default function Index() {
  const { session, loading } = useAuth();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setOnboardingComplete(value === "true");
    });
  }, []);

  useEffect(() => {
    if (loading || onboardingComplete === null) return;
    if (session) {
      router.replace(onboardingComplete ? "/(tabs)" : "/(onboarding)/welcome");
    } else {
      router.replace("/(auth)/login");
    }
  }, [session, loading, onboardingComplete]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={ACCENT.lime} />
    </View>
  );
}
