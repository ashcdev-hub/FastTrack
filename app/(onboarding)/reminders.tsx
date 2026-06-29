import React, { useState } from "react";
import { Pressable, View, Text, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cancelAllNotifications, scheduleDailyFastReminder, setupNotifications } from "@/lib/notifications";
import { useFastingStore } from "@/store/useFastingStore";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";

const ONBOARDING_KEY = "@fasttrack_onboarding_done";

export default function RemindersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { updateNotificationPreferences, updateProfile } = useProfile(user?.id ?? null);
  const { fastingHours } = useFastingStore();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  const [fastingReminders, setFastingReminders] = useState(true);
  const [checkinReminders, setCheckinReminders] = useState(true);
  const [waterReminders, setWaterReminders] = useState(false);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    setSaving(true);

    // Save notification preferences
    await updateNotificationPreferences({
      fasting_reminders: fastingReminders,
      eating_reminders: true,
      daily_digest: true,
      streak_reminders: true,
      water_reminders: waterReminders,
      checkin_reminders: checkinReminders,
      reminder_time: reminderTime,
      water_interval_hours: 2,
    });

    // Schedule notifications
    await setupNotifications();
    await cancelAllNotifications();
    if (fastingReminders) {
      const [hour, minute] = reminderTime.split(":").map(Number);
      await scheduleDailyFastReminder(hour, minute);
    }

    // Mark onboarding as complete (server + local)
    await updateProfile({ onboarding_completed: true });
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");

    // Navigate to main app
    router.replace("/(tabs)");
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: c.bg }} contentContainerClassName="px-6" contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => router.back()} className="mb-8" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-sm">
          Back
        </Text>
      </Pressable>

      <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-3xl mb-2">
        Stay on track
      </Text>
      <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-sm mb-8">
        Set up reminders to help you stay consistent
      </Text>

      {/* Toggles */}
      <View className="glass-panel overflow-hidden mb-6">
        <View className="flex-row justify-between items-center p-4" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Fasting reminders</Text>
          <Switch
            value={fastingReminders}
            onValueChange={setFastingReminders}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View className="flex-row justify-between items-center p-4" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Check-in reminders</Text>
          <Switch
            value={checkinReminders}
            onValueChange={setCheckinReminders}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View className="flex-row justify-between items-center p-4">
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Water reminders</Text>
          <Switch
            value={waterReminders}
            onValueChange={setWaterReminders}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Reminder Time */}
      <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-2">
        Fast reminder time
      </Text>
      <View className="flex-row gap-2 mb-8">
        {["06:00", "12:00", "18:00", "20:00", "22:00"].map((time) => {
          const isActive = reminderTime === time;
          const label = time === "06:00" ? "6am" : time === "12:00" ? "12pm" : time === "18:00" ? "6pm" : time === "20:00" ? "8pm" : "10pm";
          return (
            <Pressable
              key={time}
              onPress={() => setReminderTime(time)}
              className="flex-1 py-2.5 rounded-lg items-center"
              style={{ backgroundColor: isActive ? ACCENT.lime : c.buttonBg }}
            >
              <Text style={{ color: isActive ? c.textOnAccent : c.textSecondary, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-xs">
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Complete */}
      <Pressable
        onPress={handleComplete} disabled={saving}
        className="rounded-xl py-4"
        style={{ backgroundColor: ACCENT.lime }}
      >
        <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold" }} className="text-center text-lg">
          Start Tracking
        </Text>
      </Pressable>

      {/* Step indicator */}
      <View className="flex-row gap-2 mt-10 justify-center">
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT.lime }} />
      </View>
    </ScrollView>
  );
}
