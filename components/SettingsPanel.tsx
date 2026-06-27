import React, { useState, useEffect } from "react";
import { Pressable, View, Text, TextInput, ScrollView, Switch, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useProfile } from "@/hooks/useProfile";
import { useGoalStore } from "@/store/useGoalStore";
import { useThemeStore } from "@/lib/theme-store";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { router } from "expo-router";
import { cancelAllNotifications, scheduleDailyFastReminder, scheduleDailyNotification } from "@/lib/notifications";
import { DEFAULT_UNITS, displayWeight, displayHeight, weightUnitLabel, heightUnitLabel, parseWeightInput } from "@/lib/units";
import type { UnitPreferences } from "@/lib/units";
import type { Profile } from "@/lib/types";

type SettingsPanelProps = {
  userId: string | null;
  initialExpand?: string;
};

export function SettingsPanel({ userId, initialExpand }: SettingsPanelProps) {
  const {
    profile,
    updateProfile,
    updateNotificationPreferences,
    updateUnitPreferences,
    updatePassword,
    updateEmail,
  } = useProfile(userId);
  const { theme, toggleTheme } = useThemeStore();
  const { waterGoalMl, updateGoals } = useGoalStore();
  const c = getThemeColors(theme);
  const { toast, success, error: toastError } = useToast();

  const [expandedSection, setExpandedSection] = useState<string | null>(initialExpand ?? null);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [weight, setWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [height, setHeight] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notifications, setNotifications] = useState<Profile["notification_preferences"]>(profile?.notification_preferences ?? {
    fasting_reminders: true,
    eating_reminders: true,
    daily_digest: true,
    streak_reminders: true,
    water_reminders: false,
    checkin_reminders: true,
    reminder_time: "20:00",
    water_interval_hours: 2,
    checkin_mode: "midway",
    checkin_custom_time: "14:00",
    eat_window_reminder: false,
    eat_window_reminder_minutes: 15,
    notification_days: [1, 2, 3, 4, 5, 6, 7],
  });
  const [unitPrefs, setUnitPrefs] = useState<UnitPreferences>(profile?.unit_preferences ?? DEFAULT_UNITS);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<string | null>(null);
  const [pickerHour, setPickerHour] = useState(20);
  const [pickerMinute, setPickerMinute] = useState(0);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      const prefs = profile.unit_preferences ?? DEFAULT_UNITS;
      setWeight(profile.weight_kg ? displayWeight(profile.weight_kg, prefs) : "");
      setGoalWeight(profile.goal_weight_kg ? displayWeight(profile.goal_weight_kg, prefs) : "");
      setHeight(profile.height_cm ? displayHeight(profile.height_cm, prefs) : "");
      setNotifications(profile.notification_preferences ?? {
        fasting_reminders: true,
        eating_reminders: true,
        daily_digest: true,
        streak_reminders: true,
        water_reminders: false,
        checkin_reminders: true,
        reminder_time: "20:00",
        water_interval_hours: 2,
        checkin_mode: "midway",
        checkin_custom_time: "14:00",
        eat_window_reminder: false,
        eat_window_reminder_minutes: 15,
        notification_days: [1, 2, 3, 4, 5, 6, 7],
      });
      setUnitPrefs(profile.unit_preferences ?? DEFAULT_UNITS);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    const updates: any = {
      display_name: displayName.trim() || null,
      goal_weight_kg: goalWeight ? parseWeightInput(goalWeight, unitPrefs) : null,
    };
    const { error } = await updateProfile(updates);
    if (error) toastError("Failed to save profile");
    else success("Profile updated");
  };

  const handleSaveNotifications = async () => {
    const { error } = await updateNotificationPreferences(notifications);
    if (error) {
      toastError("Failed to save notification preferences");
    } else {
      await cancelAllNotifications();
      if (notifications.fasting_reminders && notifications.reminder_time) {
        const [hour, minute] = notifications.reminder_time.split(":").map(Number);
        await scheduleDailyFastReminder(hour, minute);
      }
      if (notifications.eating_reminders && notifications.reminder_time) {
        const [hour, minute] = notifications.reminder_time.split(":").map(Number);
        await scheduleDailyNotification("Time to eat", "Your eating window is open. Track your meals!", hour, minute);
      }
      if (notifications.checkin_reminders && notifications.checkin_mode === "custom" && notifications.checkin_custom_time) {
        const [hour, minute] = notifications.checkin_custom_time.split(":").map(Number);
        await scheduleDailyNotification("How are you feeling?", "Time for a fast check-in.", hour, minute);
      }
      success("Notification preferences updated");
    }
  };

  const applyTimePicker = () => {
    const timeStr = `${pickerHour.toString().padStart(2, "0")}:${pickerMinute.toString().padStart(2, "0")}`;
    if (timePickerTarget) {
      setNotifications((prev: Profile["notification_preferences"]) => ({ ...prev, [timePickerTarget]: timeStr }));
    }
    setShowTimePicker(false);
    setTimePickerTarget(null);
  };

  const openTimePicker = (field: string, currentTime: string) => {
    const [h, m] = currentTime.split(":").map(Number);
    setPickerHour(h);
    setPickerMinute(m);
    setTimePickerTarget(field);
    setShowTimePicker(true);
  };

  const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const toggleDay = (day: number) => {
    const current: number[] = notifications.notification_days ?? [1, 2, 3, 4, 5, 6, 7];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort();
    setNotifications((prev: Profile["notification_preferences"]) => ({ ...prev, notification_days: next }));
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return;
    const { error } = await updateEmail(newEmail.trim());
    if (error) toastError(error.message);
    else { success("Confirmation email sent. Please check your inbox."); setNewEmail(""); }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toastError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toastError("Passwords do not match"); return; }
    const { error } = await updatePassword(newPassword);
    if (error) toastError(error.message);
    else { success("Password updated"); setNewPassword(""); setConfirmPassword(""); }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const bmi = profile?.bmi;
  const bmiCategory = bmi
    ? bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese"
    : null;

  const bmiColors = bmiCategory
    ? bmiCategory === "Normal"
      ? { bg: ACCENT.limeBg, text: ACCENT.lime }
      : bmiCategory === "Overweight"
        ? { bg: ACCENT.amberBg, text: ACCENT.amber }
        : { bg: ACCENT.roseBg, text: ACCENT.rose }
    : null;

  const inputStyle = {
    backgroundColor: c.inputBg,
    color: c.text,
    fontFamily: "Inter_400Regular" as const,
  };

  const SectionCard = ({ section, title, children }: { section: string; title: string; children: React.ReactNode }) => (
    <View className="glass-panel overflow-hidden mb-3">
      <Pressable onPress={() => toggleSection(section)} className="flex-row justify-between items-center px-5 py-4">
        <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 15 }}>{title}</Text>
        <MaterialCommunityIcons
          name={expandedSection === section ? "chevron-up" : "chevron-down"}
          size={20}
          color={c.textMuted}
        />
      </Pressable>
      {expandedSection === section && <View className="px-5 pb-4">{children}</View>}
    </View>
  );

  return (
    <View className="mb-6">
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />

      <SectionCard section="profile" title="Profile Details">
        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Display Name</Text>
        <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Your name" placeholderTextColor={c.placeholder} className="rounded-xl px-4 py-3 mb-3" style={inputStyle} />

        <View className="flex-row gap-2 mb-3">
          <View className="flex-1">
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Gender</Text>
            <View className="rounded-xl px-4 py-3" style={{ backgroundColor: c.buttonBg }}>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", textTransform: "capitalize" }}>
                {profile?.gender ?? "Not set"}
              </Text>
            </View>
          </View>
          <View className="flex-1">
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Age</Text>
            <View className="rounded-xl px-4 py-3" style={{ backgroundColor: c.buttonBg }}>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }}>
                {profile?.age ?? "—"}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row gap-2 mb-3">
          <View className="flex-1">
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Weight ({weightUnitLabel(unitPrefs)})</Text>
            <Pressable
              onPress={() => router.push("/(tabs)")}
              className="rounded-xl px-4 py-3 flex-row items-center justify-between"
              style={{ backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.inputBorder }}
            >
              <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }}>
                {weight || (unitPrefs.weight === "lbs" ? "154" : "70")}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color={c.textMuted} />
            </Pressable>
          </View>
          <View className="flex-1">
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Height ({heightUnitLabel(unitPrefs)})</Text>
            <View className="rounded-xl px-4 py-3" style={{ backgroundColor: c.buttonBg }}>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }}>
                {height || "—"}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row gap-2 mb-3">
          <View className="flex-1">
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Goal Weight ({weightUnitLabel(unitPrefs)})</Text>
            <TextInput value={goalWeight} onChangeText={setGoalWeight} placeholder={unitPrefs.weight === "lbs" ? "143" : "75"} placeholderTextColor={c.placeholder} keyboardType="numeric" className="rounded-xl px-4 py-3" style={inputStyle} />
          </View>
          <View className="flex-1" />
        </View>

        {bmi && bmiColors && (
          <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: bmiColors.bg }}>
            <Text style={{ color: bmiColors.text, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-sm">
              BMI: {bmi} ({bmiCategory})
            </Text>
          </View>
        )}

        <Pressable onPress={handleSaveProfile} className="rounded-xl py-3 items-center" style={{ backgroundColor: ACCENT.lime }}>
          <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold" }}>Save Profile</Text>
        </Pressable>
      </SectionCard>

      <SectionCard section="account" title="Account">
        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Change Email</Text>
        <TextInput value={newEmail} onChangeText={setNewEmail} placeholder="new@email.com" placeholderTextColor={c.placeholder} keyboardType="email-address" autoCapitalize="none" className="rounded-xl px-4 py-3 mb-3" style={inputStyle} />
        <Pressable onPress={handleChangeEmail} className="rounded-xl py-3 items-center mb-4" style={{ backgroundColor: c.buttonBg }}>
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>Update Email</Text>
        </Pressable>

        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Change Password</Text>
        <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="New password" placeholderTextColor={c.placeholder} secureTextEntry className="rounded-xl px-4 py-3 mb-2" style={inputStyle} />
        <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" placeholderTextColor={c.placeholder} secureTextEntry className="rounded-xl px-4 py-3 mb-3" style={inputStyle} />
        <Pressable onPress={handleChangePassword} className="rounded-xl py-3 items-center" style={{ backgroundColor: c.buttonBg }}>
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>Update Password</Text>
        </Pressable>
      </SectionCard>

      <SectionCard section="notifications" title="Notifications">
        {/* Fasting Reminders */}
        <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Fasting Reminders</Text>
          <Switch
            value={notifications.fasting_reminders}
            onValueChange={(value) => setNotifications((prev: Profile["notification_preferences"]) => ({ ...prev, fasting_reminders: value }))}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>
        {notifications.fasting_reminders && (
          <Pressable onPress={() => openTimePicker("reminder_time", notifications.reminder_time ?? "20:00")}
            className="flex-row items-center justify-between rounded-xl px-4 py-3 mt-2 mb-3"
            style={{ backgroundColor: c.inputBg }}
          >
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>Remind at</Text>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>{notifications.reminder_time ?? "20:00"}</Text>
          </Pressable>
        )}

        {/* Eating Reminders */}
        <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Eating Reminders</Text>
          <Switch
            value={notifications.eating_reminders}
            onValueChange={(value) => setNotifications((prev: Profile["notification_preferences"]) => ({ ...prev, eating_reminders: value }))}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Check-in Reminders */}
        <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Check-in Reminders</Text>
          <Switch
            value={notifications.checkin_reminders}
            onValueChange={(value) => setNotifications((prev: Profile["notification_preferences"]) => ({ ...prev, checkin_reminders: value }))}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>
        {notifications.checkin_reminders && (
          <View className="mt-2 mb-3">
            <Pressable onPress={() => setNotifications((prev: Profile["notification_preferences"]) => ({ ...prev, checkin_mode: prev.checkin_mode === "midway" ? "custom" : "midway" }))}
              className="flex-row items-center gap-2 mb-2"
            >
              <MaterialCommunityIcons name={notifications.checkin_mode === "midway" ? "radiobox-marked" : "radiobox-blank"} size={18} color={notifications.checkin_mode === "midway" ? ACCENT.lime : c.textMuted} />
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>Midway through fast</Text>
            </Pressable>
            <Pressable onPress={() => setNotifications((prev: Profile["notification_preferences"]) => ({ ...prev, checkin_mode: prev.checkin_mode === "custom" ? "midway" : "custom" }))}
              className="flex-row items-center gap-2 mb-2"
            >
              <MaterialCommunityIcons name={notifications.checkin_mode === "custom" ? "radiobox-marked" : "radiobox-blank"} size={18} color={notifications.checkin_mode === "custom" ? ACCENT.lime : c.textMuted} />
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>Custom time</Text>
            </Pressable>
            {notifications.checkin_mode === "custom" && (
              <Pressable onPress={() => openTimePicker("checkin_custom_time", notifications.checkin_custom_time ?? "14:00")}
                className="flex-row items-center justify-between rounded-xl px-4 py-3 ml-6"
                style={{ backgroundColor: c.inputBg }}
              >
                <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>Time</Text>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>{notifications.checkin_custom_time ?? "14:00"}</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Streak Milestones */}
        <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Streak Milestones</Text>
          <Switch
            value={notifications.streak_reminders}
            onValueChange={(value) => setNotifications((prev: Profile["notification_preferences"]) => ({ ...prev, streak_reminders: value }))}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Water Reminders */}
        <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Water Reminders</Text>
          <Switch
            value={notifications.water_reminders}
            onValueChange={(value) => setNotifications((prev: Profile["notification_preferences"]) => ({ ...prev, water_reminders: value }))}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>
        {notifications.water_reminders && (
          <View className="mt-2 mb-3">
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 6 }}>Interval</Text>
            <View className="flex-row gap-2">
              {[1, 2, 3, 4].map((h) => {
                const isActive = notifications.water_interval_hours === h;
                return (
                  <Pressable key={h} onPress={() => setNotifications((prev: Profile["notification_preferences"]) => ({ ...prev, water_interval_hours: h }))}
                    className="flex-1 py-2 rounded-lg items-center"
                    style={{ backgroundColor: isActive ? ACCENT.lime : c.buttonBg }}
                  >
                    <Text style={{ color: isActive ? "#161e00" : c.textSecondary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 12 }}>{h}h</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Daily Digest Email */}
        <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Daily Digest Email</Text>
          <Switch
            value={notifications.daily_digest}
            onValueChange={(value) => setNotifications((prev: Profile["notification_preferences"]) => ({ ...prev, daily_digest: value }))}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Eating Window Reminder */}
        <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Eat Window Reminder</Text>
          <Switch
            value={notifications.eat_window_reminder}
            onValueChange={(value) => setNotifications((prev: Profile["notification_preferences"]) => ({ ...prev, eat_window_reminder: value }))}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>
        {notifications.eat_window_reminder && (
          <View className="mt-2 mb-3">
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 6 }}>Remind before eating window</Text>
            <View className="flex-row items-center gap-3 mb-2">
              <Pressable onPress={() => setNotifications((prev: Profile["notification_preferences"]) => ({ ...prev, eat_window_reminder_minutes: Math.max(1, (prev.eat_window_reminder_minutes ?? 15) - 5) }))} className="p-2 rounded-lg" style={{ backgroundColor: c.buttonBg }}>
                <MaterialCommunityIcons name="minus" size={16} color={c.text} />
              </Pressable>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18, minWidth: 40, textAlign: "center" }}>{notifications.eat_window_reminder_minutes ?? 15}</Text>
              <Pressable onPress={() => setNotifications((prev: Profile["notification_preferences"]) => ({ ...prev, eat_window_reminder_minutes: Math.min(120, (prev.eat_window_reminder_minutes ?? 15) + 5) }))} className="p-2 rounded-lg" style={{ backgroundColor: c.buttonBg }}>
                <MaterialCommunityIcons name="plus" size={16} color={c.text} />
              </Pressable>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 13 }}>min before</Text>
            </View>
            <View className="flex-row gap-2">
              {[5, 15, 30, 60].map((v) => (
                <Pressable key={v} onPress={() => setNotifications((prev: Profile["notification_preferences"]) => ({ ...prev, eat_window_reminder_minutes: v }))}
                  className="flex-1 py-2 rounded-lg items-center"
                  style={{ backgroundColor: (notifications.eat_window_reminder_minutes ?? 15) === v ? ACCENT.lime : c.buttonBg }}
                >
                  <Text style={{ color: (notifications.eat_window_reminder_minutes ?? 15) === v ? "#161e00" : c.textSecondary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 12 }}>{v}m</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Notification Days */}
        <View className="mt-3 mb-3">
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 6 }}>Notification Days</Text>
          <View className="flex-row gap-2">
            {DAY_LABELS.map((label, i) => {
              const day = i + 1;
              const isActive = (notifications.notification_days ?? [1, 2, 3, 4, 5, 6, 7]).includes(day);
              return (
                <Pressable key={day} onPress={() => toggleDay(day)}
                  className="flex-1 py-2.5 rounded-lg items-center"
                  style={{ backgroundColor: isActive ? ACCENT.lime : c.buttonBg }}
                >
                  <Text style={{ color: isActive ? "#161e00" : c.textSecondary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 12 }}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable onPress={handleSaveNotifications} className="rounded-xl py-3 items-center mt-3" style={{ backgroundColor: ACCENT.lime }}>
          <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold" }}>Save Preferences</Text>
        </Pressable>
      </SectionCard>

      <SectionCard section="preferences" title="Preferences">
        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-2">Weight Unit</Text>
        <View className="flex-row gap-2 mb-4">
          {(["kg", "lbs"] as const).map((unit) => (
            <Pressable
              key={unit}
              onPress={() => setUnitPrefs({ ...unitPrefs, weight: unit })}
              className="flex-1 py-3 rounded-xl items-center"
              style={{ backgroundColor: unitPrefs.weight === unit ? ACCENT.lime : c.buttonBg }}
            >
              <Text
                className="text-sm"
                style={{
                  color: unitPrefs.weight === unit ? "#161e00" : c.textSecondary,
                  fontFamily: "SpaceGrotesk_600SemiBold",
                }}
              >
                {unit === "kg" ? "Kilograms (kg)" : "Pounds (lbs)"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-2">Height Unit</Text>
        <View className="flex-row gap-2 mb-4">
          {(["cm", "ft"] as const).map((unit) => (
            <Pressable
              key={unit}
              onPress={() => setUnitPrefs({ ...unitPrefs, height: unit })}
              className="flex-1 py-3 rounded-xl items-center"
              style={{ backgroundColor: unitPrefs.height === unit ? ACCENT.lime : c.buttonBg }}
            >
              <Text
                className="text-sm"
                style={{
                  color: unitPrefs.height === unit ? "#161e00" : c.textSecondary,
                  fontFamily: "SpaceGrotesk_600SemiBold",
                }}
              >
                {unit === "cm" ? "Centimeters (cm)" : "Feet/Inches (ft)"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-2">Water Unit</Text>
        <View className="flex-row gap-2 mb-4">
          {(["ml", "floz"] as const).map((unit) => (
            <Pressable
              key={unit}
              onPress={() => setUnitPrefs({ ...unitPrefs, water: unit })}
              className="flex-1 py-3 rounded-xl items-center"
              style={{ backgroundColor: unitPrefs.water === unit ? ACCENT.lime : c.buttonBg }}
            >
              <Text
                className="text-sm"
                style={{
                  color: unitPrefs.water === unit ? "#161e00" : c.textSecondary,
                  fontFamily: "SpaceGrotesk_600SemiBold",
                }}
              >
                {unit === "ml" ? "Milliliters (ml)" : "Fluid Ounces (fl oz)"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-2">Daily Water Goal</Text>
        <View className="flex-row gap-2 mb-4">
          {[1500, 2000, 2500, 3000, 3500].map((ml) => (
            <Pressable
              key={ml}
              onPress={() => updateGoals({ waterGoalMl: ml })}
              className="flex-1 py-3 rounded-xl items-center"
              style={{ backgroundColor: waterGoalMl === ml ? ACCENT.cyan : c.buttonBg }}
            >
              <Text
                className="text-sm"
                style={{
                  color: waterGoalMl === ml ? "#001e24" : c.textSecondary,
                  fontFamily: "SpaceGrotesk_600SemiBold",
                }}
              >
                {ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={async () => {
            const { error } = await updateUnitPreferences(unitPrefs);
            if (error) toastError("Failed to save preferences");
            else success("Preferences updated");
          }}
          className="rounded-xl py-3 items-center"
          style={{ backgroundColor: ACCENT.lime }}
        >
          <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold" }}>Save Preferences</Text>
        </Pressable>
      </SectionCard>

      <SectionCard section="appearance" title="Appearance">
        <View className="flex-row justify-between items-center py-3">
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Dark Mode</Text>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>
      </SectionCard>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowTimePicker(false)}>
          <Pressable className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }} onStartShouldSetResponder={() => true}>
            <View className="flex-row justify-between items-center mb-4">
              <Pressable onPress={() => setShowTimePicker(false)}>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14 }}>Cancel</Text>
              </Pressable>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18 }}>Select Time</Text>
              <Pressable onPress={applyTimePicker}>
                <Text style={{ color: ACCENT.lime, fontFamily: "Inter_700Bold", fontSize: 14 }}>Done</Text>
              </Pressable>
            </View>
            <View className="flex-row justify-center gap-6 mb-4">
              <View className="items-center">
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 8 }}>Hour</Text>
                <ScrollView className="h-32 w-16" showsVerticalScrollIndicator={false}>
                  {hours.map((h) => (
                    <Pressable key={h} onPress={() => setPickerHour(h)}
                      className="py-2 items-center rounded-lg"
                      style={{ backgroundColor: pickerHour === h ? ACCENT.limeBg : "transparent" }}
                    >
                      <Text style={{ color: pickerHour === h ? ACCENT.lime : c.textMuted, fontFamily: pickerHour === h ? "Inter_700Bold" : "Inter_400Regular", fontSize: 18, textAlign: "center" }}>
                        {h.toString().padStart(2, "0")}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 24, marginTop: 24 }}>:</Text>
              <View className="items-center">
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 8 }}>Minute</Text>
                <ScrollView className="h-32 w-16" showsVerticalScrollIndicator={false}>
                  {minutes.map((m) => (
                    <Pressable key={m} onPress={() => setPickerMinute(m)}
                      className="py-2 items-center rounded-lg"
                      style={{ backgroundColor: pickerMinute === m ? ACCENT.limeBg : "transparent" }}
                    >
                      <Text style={{ color: pickerMinute === m ? ACCENT.lime : c.textMuted, fontFamily: pickerMinute === m ? "Inter_700Bold" : "Inter_400Regular", fontSize: 18, textAlign: "center" }}>
                        {m.toString().padStart(2, "0")}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
