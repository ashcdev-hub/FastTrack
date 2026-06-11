import React, { useState, useEffect } from "react";
import { Pressable, View, Text, TextInput, ScrollView, Switch } from "react-native";
import { useProfile } from "@/hooks/useProfile";
import { useThemeStore } from "@/lib/theme-store";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { cancelAllNotifications, scheduleDailyFastReminder } from "@/lib/notifications";
import type { Profile } from "@/lib/types";

type SettingsPanelProps = {
  userId: string | null;
};

export function SettingsPanel({ userId }: SettingsPanelProps) {
  const {
    profile,
    updateProfile,
    updateNotificationPreferences,
    updatePassword,
    updateEmail,
  } = useProfile(userId);
  const { theme, toggleTheme } = useThemeStore();
  const c = getThemeColors(theme);
  const { toast, success, error: toastError } = useToast();

  const [expandedSection, setExpandedSection] = useState<string | null>("profile");
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [gender, setGender] = useState<Profile["gender"]>(profile?.gender ?? null);
  const [age, setAge] = useState(profile?.age ? String(profile.age) : "");
  const [weight, setWeight] = useState(profile?.weight_kg ? String(profile.weight_kg) : "");
  const [goalWeight, setGoalWeight] = useState(profile?.goal_weight_kg ? String(profile.goal_weight_kg) : "");
  const [height, setHeight] = useState(profile?.height_cm ? String(profile.height_cm) : "");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notifications, setNotifications] = useState(profile?.notification_preferences ?? {
    fasting_reminders: true,
    eating_reminders: true,
    daily_digest: true,
    streak_reminders: true,
    water_reminders: false,
    checkin_reminders: true,
    reminder_time: "20:00",
    water_interval_hours: 2,
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setGender(profile.gender ?? null);
      setAge(profile.age ? String(profile.age) : "");
      setWeight(profile.weight_kg ? String(profile.weight_kg) : "");
      setGoalWeight(profile.goal_weight_kg ? String(profile.goal_weight_kg) : "");
      setHeight(profile.height_cm ? String(profile.height_cm) : "");
      setNotifications(profile.notification_preferences ?? {
        fasting_reminders: true,
        eating_reminders: true,
        daily_digest: true,
        streak_reminders: true,
        water_reminders: false,
        checkin_reminders: true,
        reminder_time: "20:00",
        water_interval_hours: 2,
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    const updates: any = {
      display_name: displayName.trim() || null,
      gender,
      age: age ? parseInt(age) : null,
      weight_kg: weight ? parseFloat(weight) : null,
      goal_weight_kg: goalWeight ? parseFloat(goalWeight) : null,
      height_cm: height ? parseFloat(height) : null,
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
      // Update scheduled notifications based on new preferences
      await cancelAllNotifications();
      if (notifications.fasting_reminders && notifications.reminder_time) {
        const [hour, minute] = notifications.reminder_time.split(":").map(Number);
        await scheduleDailyFastReminder(hour, minute);
      }
      success("Notification preferences updated");
    }
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

  const inputStyle = {
    backgroundColor: c.inputBg,
    color: c.text,
    fontFamily: "PlusJakartaSans_500Medium" as const,
  };

  return (
    <View className="mb-6">
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />

      {/* Profile Details Section */}
      <View className="rounded-2xl mb-3 overflow-hidden" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
        <Pressable onPress={() => toggleSection("profile")} className="p-4 flex-row justify-between items-center">
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_600SemiBold" }}>Profile Details</Text>
          <Text style={{ color: c.textMuted }}>{expandedSection === "profile" ? "−" : "+"}</Text>
        </Pressable>

        {expandedSection === "profile" && (
          <View className="px-4 pb-4">
            <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-1">Display Name</Text>
            <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Your name" placeholderTextColor={c.placeholder} className="rounded-xl px-4 py-3 mb-3" style={inputStyle} />

            <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-1">Gender</Text>
            <View className="flex-row gap-2 mb-3">
              {(["male", "female", "other"] as const).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(gender === g ? null : g)}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{
                    backgroundColor: gender === g ? ACCENT.mint : c.buttonBg,
                  }}
                >
                  <Text
                    className="text-sm capitalize"
                    style={{
                      color: gender === g ? c.textOnAccent : c.textSecondary,
                      fontFamily: "PlusJakartaSans_600SemiBold",
                    }}
                  >
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="flex-row gap-2 mb-3">
              <View className="flex-1">
                <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-1">Age</Text>
                <TextInput value={age} onChangeText={setAge} placeholder="25" placeholderTextColor={c.placeholder} keyboardType="numeric" className="rounded-xl px-4 py-3" style={inputStyle} />
              </View>
              <View className="flex-1">
                <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-1">Weight (kg)</Text>
                <TextInput value={weight} onChangeText={setWeight} placeholder="70" placeholderTextColor={c.placeholder} keyboardType="numeric" className="rounded-xl px-4 py-3" style={inputStyle} />
              </View>
            </View>

            <View className="flex-row gap-2 mb-3">
              <View className="flex-1">
                <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-1">Goal Weight (kg)</Text>
                <TextInput value={goalWeight} onChangeText={setGoalWeight} placeholder="75" placeholderTextColor={c.placeholder} keyboardType="numeric" className="rounded-xl px-4 py-3" style={inputStyle} />
              </View>
              <View className="flex-1">
                <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-1">Height (cm)</Text>
                <TextInput value={height} onChangeText={setHeight} placeholder="175" placeholderTextColor={c.placeholder} keyboardType="numeric" className="rounded-xl px-4 py-3" style={inputStyle} />
              </View>
            </View>

            {bmi && (
              <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: ACCENT.mintBg }}>
                <Text style={{ color: ACCENT.mint, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-sm">
                  BMI: {bmi} ({bmiCategory})
                </Text>
              </View>
            )}

            <Pressable onPress={handleSaveProfile} className="rounded-xl py-3" style={{ backgroundColor: ACCENT.mint }}>
              <Text style={{ color: c.textOnAccent, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-center">Save Profile</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Account Section */}
      <View className="rounded-2xl mb-3 overflow-hidden" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
        <Pressable onPress={() => toggleSection("account")} className="p-4 flex-row justify-between items-center">
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_600SemiBold" }}>Account</Text>
          <Text style={{ color: c.textMuted }}>{expandedSection === "account" ? "−" : "+"}</Text>
        </Pressable>

        {expandedSection === "account" && (
          <View className="px-4 pb-4">
            <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-1">Change Email</Text>
            <TextInput value={newEmail} onChangeText={setNewEmail} placeholder="new@email.com" placeholderTextColor={c.placeholder} keyboardType="email-address" autoCapitalize="none" className="rounded-xl px-4 py-3 mb-3" style={inputStyle} />
            <Pressable onPress={handleChangeEmail} className="rounded-xl py-3 mb-4" style={{ backgroundColor: c.buttonBg }}>
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-center">Update Email</Text>
            </Pressable>

            <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-1">Change Password</Text>
            <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="New password" placeholderTextColor={c.placeholder} secureTextEntry className="rounded-xl px-4 py-3 mb-2" style={inputStyle} />
            <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" placeholderTextColor={c.placeholder} secureTextEntry className="rounded-xl px-4 py-3 mb-3" style={inputStyle} />
            <Pressable onPress={handleChangePassword} className="rounded-xl py-3" style={{ backgroundColor: c.buttonBg }}>
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-center">Update Password</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Notifications Section */}
      <View className="rounded-2xl mb-3 overflow-hidden" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
        <Pressable onPress={() => toggleSection("notifications")} className="p-4 flex-row justify-between items-center">
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_600SemiBold" }}>Notifications</Text>
          <Text style={{ color: c.textMuted }}>{expandedSection === "notifications" ? "−" : "+"}</Text>
        </Pressable>

        {expandedSection === "notifications" && (
          <View className="px-4 pb-4">
            <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">Fasting Reminders</Text>
              <Switch
                value={notifications.fasting_reminders}
                onValueChange={(value) => setNotifications({ ...notifications, fasting_reminders: value })}
                trackColor={{ false: c.buttonBg, true: ACCENT.mint }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">Eating Reminders</Text>
              <Switch
                value={notifications.eating_reminders}
                onValueChange={(value) => setNotifications({ ...notifications, eating_reminders: value })}
                trackColor={{ false: c.buttonBg, true: ACCENT.mint }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">Check-in Reminders</Text>
              <Switch
                value={notifications.checkin_reminders}
                onValueChange={(value) => setNotifications({ ...notifications, checkin_reminders: value })}
                trackColor={{ false: c.buttonBg, true: ACCENT.mint }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">Streak Milestones</Text>
              <Switch
                value={notifications.streak_reminders}
                onValueChange={(value) => setNotifications({ ...notifications, streak_reminders: value })}
                trackColor={{ false: c.buttonBg, true: ACCENT.mint }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">Water Reminders</Text>
              <Switch
                value={notifications.water_reminders}
                onValueChange={(value) => setNotifications({ ...notifications, water_reminders: value })}
                trackColor={{ false: c.buttonBg, true: ACCENT.mint }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">Daily Digest Email</Text>
              <Switch
                value={notifications.daily_digest}
                onValueChange={(value) => setNotifications({ ...notifications, daily_digest: value })}
                trackColor={{ false: c.buttonBg, true: ACCENT.mint }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Reminder Time */}
            <View className="mt-3 mb-3">
              <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-2">Fast reminder time</Text>
              <View className="flex-row gap-2">
                {["06:00", "12:00", "18:00", "20:00", "22:00"].map((time) => {
                  const isActive = notifications.reminder_time === time;
                  const label = time === "06:00" ? "6am" : time === "12:00" ? "12pm" : time === "18:00" ? "6pm" : time === "20:00" ? "8pm" : "10pm";
                  return (
                    <Pressable
                      key={time}
                      onPress={() => setNotifications({ ...notifications, reminder_time: time })}
                      className="flex-1 py-2 rounded-lg items-center"
                      style={{ backgroundColor: isActive ? ACCENT.mint : c.buttonBg }}
                    >
                      <Text style={{ color: isActive ? c.textOnAccent : c.textSecondary, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs">
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Water Interval */}
            <View className="mb-3">
              <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-2">Water reminder interval</Text>
              <View className="flex-row gap-2">
                {[1, 2, 3, 4].map((hours) => {
                  const isActive = notifications.water_interval_hours === hours;
                  return (
                    <Pressable
                      key={hours}
                      onPress={() => setNotifications({ ...notifications, water_interval_hours: hours })}
                      className="flex-1 py-2 rounded-lg items-center"
                      style={{ backgroundColor: isActive ? ACCENT.mint : c.buttonBg }}
                    >
                      <Text style={{ color: isActive ? c.textOnAccent : c.textSecondary, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs">
                        {hours}h
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable onPress={handleSaveNotifications} className="rounded-xl py-3 mt-3" style={{ backgroundColor: ACCENT.mint }}>
              <Text style={{ color: c.textOnAccent, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-center">Save Preferences</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Appearance Section */}
      <View className="rounded-2xl mb-3 overflow-hidden" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
        <Pressable onPress={() => toggleSection("appearance")} className="p-4 flex-row justify-between items-center">
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_600SemiBold" }}>Appearance</Text>
          <Text style={{ color: c.textMuted }}>{expandedSection === "appearance" ? "−" : "+"}</Text>
        </Pressable>

        {expandedSection === "appearance" && (
          <View className="px-4 pb-4">
            <View className="flex-row justify-between items-center py-3">
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">Dark Mode</Text>
              <Switch
                value={theme === "dark"}
                onValueChange={toggleTheme}
                trackColor={{ false: c.buttonBg, true: ACCENT.mint }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
