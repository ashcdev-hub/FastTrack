import React, { useState } from "react";
import { Pressable, View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useFastingStore } from "@/store/useFastingStore";
import { ScheduleSelector } from "@/components/ScheduleSelector";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";

export default function ScheduleScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { updateFastingSchedule } = useProfile(user?.id ?? null);
  const { setFastingHours, setEatingHours } = useFastingStore();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  const [selectedSchedule, setSelectedSchedule] = useState<string | null>("16:8");

  const handleContinue = async () => {
    const fasting = selectedSchedule === "OMAD" ? 23 : parseInt(selectedSchedule?.split(":")[0] ?? "16");
    const eating = selectedSchedule === "OMAD" ? 1 : parseInt(selectedSchedule?.split(":")[1] ?? "8");
    setFastingHours(fasting);
    setEatingHours(eating);
    await updateFastingSchedule(fasting, eating);
    router.push("/(onboarding)/trackers");
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: c.bg }} contentContainerClassName="px-6" contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => router.back()} className="mb-8" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-sm">
          Back
        </Text>
      </Pressable>

      <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-3xl mb-2">
        Choose your schedule
      </Text>
      <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-sm mb-8">
        You can change this later in settings
      </Text>

      <ScheduleSelector
        selected={selectedSchedule}
        onSelect={(schedule) => setSelectedSchedule(schedule)}
      />

      <Pressable
        onPress={handleContinue}
        className="rounded-xl py-4"
        style={{ backgroundColor: ACCENT.lime }}
      >
        <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold" }} className="text-center text-lg">
          Continue
        </Text>
      </Pressable>

      {/* Step indicator */}
      <View className="flex-row gap-2 mt-10 justify-center">
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT.lime }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
      </View>
    </ScrollView>
  );
}
