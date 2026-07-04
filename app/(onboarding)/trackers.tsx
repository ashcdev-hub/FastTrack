import React, { useState } from "react";
import { Pressable, View, Text, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTrackerStore, DEFAULT_TRACKERS } from "@/store/useTrackerStore";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import type { TrackerId } from "@/lib/types";

const TRACKERS: { id: TrackerId; label: string; icon: string; description: string }[] = [
  { id: "fasting", label: "Fasting", icon: "timer-outline", description: "Track your fasting sessions and phases" },
  { id: "workouts", label: "Workouts", icon: "dumbbell", description: "Log exercises and track your progress" },
  { id: "food", label: "Food", icon: "food-apple-outline", description: "Log meals and track your macros" },
  { id: "period", label: "Period", icon: "calendar-heart", description: "Track your menstrual cycle and get phase-aware fasting tips" },
];

export default function TrackersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { updateTrackerPreferences } = useProfile(user?.id ?? null);
  const { setEnabled, enabled } = useTrackerStore();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);

  const [trackers, setTrackers] = useState<Record<TrackerId, boolean>>({ ...DEFAULT_TRACKERS, ...enabled });

  const toggle = (id: TrackerId) => {
    setTrackers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleContinue = async () => {
    for (const [id, value] of Object.entries(trackers)) {
      await setEnabled(id as TrackerId, value);
    }
    await updateTrackerPreferences(trackers);
    router.push("/(onboarding)/reminders");
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: c.bg }} contentContainerClassName="px-6" contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => router.back()} className="mb-8" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-sm">
          Back
        </Text>
      </Pressable>

      <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-3xl mb-2">
        Your trackers
      </Text>
      <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-sm mb-8">
        Pick the trackers you want to use. You can change these anytime in Settings.
      </Text>

      <View className="glass-bg glass-border overflow-hidden mb-6">
        {TRACKERS.map((t, i) => (
          <View
            key={t.id}
            className="flex-row items-center p-4"
            style={{ borderBottomWidth: i < TRACKERS.length - 1 ? 1 : 0, borderBottomColor: c.divider }}
          >
            <View className="rounded-lg items-center justify-center mr-3" style={{ width: 36, height: 36, backgroundColor: accent.cyanBg }}>
              <MaterialCommunityIcons name={t.icon as any} size={20} color={accent.cyan} />
            </View>
            <View className="flex-1">
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 15 }}>{t.label}</Text>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                {t.description}
              </Text>
            </View>
            <Switch
              value={trackers[t.id]}
              onValueChange={() => toggle(t.id)}
              trackColor={{ false: c.buttonBg, true: accent.lime }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}
      </View>

      <Pressable
        onPress={handleContinue}
        className="rounded-xl py-4"
        style={{ backgroundColor: accent.lime }}
      >
        <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold" }} className="text-center text-lg">
          Continue
        </Text>
      </Pressable>

      {/* Step indicator */}
      <View className="flex-row gap-2 mt-10 justify-center">
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent.lime }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
      </View>
    </ScrollView>
  );
}
