import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { useThemeStore } from "@/lib/theme-store";

const ONBOARDING_KEY = "@fasttrack_onboarding_done";

export default function Index() {
  const { session, loading, user } = useAuth();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      if (value === "true") {
        setOnboardingComplete(true);
      }
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    if (session && onboardingComplete === null) {
      // Check server-side onboarding status
      supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.onboarding_completed) {
            AsyncStorage.setItem(ONBOARDING_KEY, "true");
            setOnboardingComplete(true);
          } else {
            setOnboardingComplete(false);
          }
        });
      return;
    }
    if (onboardingComplete === null) {
      if (!session) {
        router.replace("/(auth)/login");
      }
      return;
    }
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
