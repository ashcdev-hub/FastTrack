import { Stack } from "expo-router";
import { getThemeColors } from "@/lib/theme-colors";
import { useThemeStore } from "@/lib/theme-store";

export default function OnboardingLayout() {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.bg },
      }}
    />
  );
}
