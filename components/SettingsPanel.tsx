import React, { useState, useEffect } from "react";
import { Pressable, View, Text, TextInput, ScrollView, Switch } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useProfile } from "@/hooks/useProfile";
import { useThemeStore } from "@/lib/theme-store";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { cancelAllNotifications, scheduleDailyFastReminder } from "@/lib/notifications";
import { DEFAULT_UNITS, displayWeight, displayHeight, weightUnitLabel, heightUnitLabel, parseWeightInput, parseHeightInput } from "@/lib/units";
import type { Profile } from "@/lib/types";
import type { UnitPreferences } from "@/lib/units";

type SettingsPanelProps = {
  userId: string | null;
};

export function SettingsPanel({ userId }: SettingsPanelProps) {
  const {
    profile,
    updateProfile,
    updateNotificationPreferences,
    updateUnitPreferences,
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
  const [weight, setWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [height, setHeight] = useState("");
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
  const [unitPrefs, setUnitPrefs] = useState<UnitPreferences>(profile?.unit_preferences ?? DEFAULT_UNITS);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setGender(profile.gender ?? null);
      setAge(profile.age ? String(profile.age) : "");
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
      });
      setUnitPrefs(profile.unit_preferences ?? DEFAULT_UNITS);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    const updates: any = {
      display_name: displayName.trim() || null,
      gender,
      age: age ? parseInt(age) : null,
      weight_kg: weight ? parseWeightInput(weight, unitPrefs) : null,
      goal_weight_kg: goalWeight ? parseWeightInput(goalWeight, unitPrefs) : null,
      height_cm: height ? parseHeightInput(height, unitPrefs) : null,
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

        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Gender</Text>
        <View className="flex-row gap-2 mb-3">
          {(["male", "female", "other"] as const).map((g) => (
            <Pressable
              key={g}
              onPress={() => setGender(gender === g ? null : g)}
              className="flex-1 py-3 rounded-xl items-center"
              style={{
                backgroundColor: gender === g ? ACCENT.lime : c.buttonBg,
              }}
            >
              <Text
                className="text-sm capitalize"
                style={{
                  color: gender === g ? c.textOnAccent : c.textSecondary,
                  fontFamily: "SpaceGrotesk_600SemiBold",
                }}
              >
                {g}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row gap-2 mb-3">
          <View className="flex-1">
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Age</Text>
            <TextInput value={age} onChangeText={setAge} placeholder="25" placeholderTextColor={c.placeholder} keyboardType="numeric" className="rounded-xl px-4 py-3" style={inputStyle} />
          </View>
          <View className="flex-1">
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Weight ({weightUnitLabel(unitPrefs)})</Text>
            <TextInput value={weight} onChangeText={setWeight} placeholder={unitPrefs.weight === "lbs" ? "154" : "70"} placeholderTextColor={c.placeholder} keyboardType="numeric" className="rounded-xl px-4 py-3" style={inputStyle} />
          </View>
        </View>

        <View className="flex-row gap-2 mb-3">
          <View className="flex-1">
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Goal Weight ({weightUnitLabel(unitPrefs)})</Text>
            <TextInput value={goalWeight} onChangeText={setGoalWeight} placeholder={unitPrefs.weight === "lbs" ? "143" : "75"} placeholderTextColor={c.placeholder} keyboardType="numeric" className="rounded-xl px-4 py-3" style={inputStyle} />
          </View>
          <View className="flex-1">
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Height ({heightUnitLabel(unitPrefs)})</Text>
            <TextInput value={height} onChangeText={setHeight} placeholder={unitPrefs.height === "ft" ? "5'9\"" : "175"} placeholderTextColor={c.placeholder} keyboardType={unitPrefs.height === "ft" ? "default" : "numeric"} className="rounded-xl px-4 py-3" style={inputStyle} />
          </View>
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
        <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Fasting Reminders</Text>
          <Switch
            value={notifications.fasting_reminders}
            onValueChange={(value) => setNotifications({ ...notifications, fasting_reminders: value })}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Eating Reminders</Text>
          <Switch
            value={notifications.eating_reminders}
            onValueChange={(value) => setNotifications({ ...notifications, eating_reminders: value })}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Check-in Reminders</Text>
          <Switch
            value={notifications.checkin_reminders}
            onValueChange={(value) => setNotifications({ ...notifications, checkin_reminders: value })}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Streak Milestones</Text>
          <Switch
            value={notifications.streak_reminders}
            onValueChange={(value) => setNotifications({ ...notifications, streak_reminders: value })}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Water Reminders</Text>
          <Switch
            value={notifications.water_reminders}
            onValueChange={(value) => setNotifications({ ...notifications, water_reminders: value })}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View className="flex-row justify-between items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">Daily Digest Email</Text>
          <Switch
            value={notifications.daily_digest}
            onValueChange={(value) => setNotifications({ ...notifications, daily_digest: value })}
            trackColor={{ false: c.buttonBg, true: ACCENT.lime }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View className="mt-3 mb-3">
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-2">Fast reminder time</Text>
          <View className="flex-row gap-2">
            {["06:00", "12:00", "18:00", "20:00", "22:00"].map((time) => {
              const isActive = notifications.reminder_time === time;
              const label = time === "06:00" ? "6am" : time === "12:00" ? "12pm" : time === "18:00" ? "6pm" : time === "20:00" ? "8pm" : "10pm";
              return (
                <Pressable
                  key={time}
                  onPress={() => setNotifications({ ...notifications, reminder_time: time })}
                  className="flex-1 py-2 rounded-lg items-center"
                  style={{ backgroundColor: isActive ? ACCENT.lime : c.buttonBg }}
                >
                  <Text style={{ color: isActive ? "#161e00" : c.textSecondary, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-xs">
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mb-3">
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-2">Water reminder interval</Text>
          <View className="flex-row gap-2">
            {[1, 2, 3, 4].map((hours) => {
              const isActive = notifications.water_interval_hours === hours;
              return (
                <Pressable
                  key={hours}
                  onPress={() => setNotifications({ ...notifications, water_interval_hours: hours })}
                  className="flex-1 py-2 rounded-lg items-center"
                  style={{ backgroundColor: isActive ? ACCENT.lime : c.buttonBg }}
                >
                  <Text style={{ color: isActive ? "#161e00" : c.textSecondary, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-xs">
                    {hours}h
                  </Text>
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
    </View>
  );
}
