import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { View, ActivityIndicator } from "react-native";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { useThemeStore } from "@/lib/theme-store";

export default function Index() {
  const { session, loading } = useAuth();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={ACCENT.mint} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
