import React, { useState, useEffect } from "react";
import { Pressable,
  View,
  Text,
  TextInput,
  ScrollView,
  Switch,
} from "react-native";
import { useProfile } from "@/hooks/useProfile";
import { useThemeStore } from "@/lib/theme-store";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
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
  const { toast, success, error: toastError } = useToast();

  const [expandedSection, setExpandedSection] = useState<string | null>("profile");
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [gender, setGender] = useState<Profile["gender"]>(profile?.gender ?? null);
  const [age, setAge] = useState(profile?.age ? String(profile.age) : "");
  const [weight, setWeight] = useState(profile?.weight_kg ? String(profile.weight_kg) : "");
  const [height, setHeight] = useState(profile?.height_cm ? String(profile.height_cm) : "");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notifications, setNotifications] = useState(profile?.notification_preferences ?? {
    fasting_reminders: true,
    eating_reminders: true,
    daily_digest: true,
  });

  // Sync profile data into local state when it loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setGender(profile.gender ?? null);
      setAge(profile.age ? String(profile.age) : "");
      setWeight(profile.weight_kg ? String(profile.weight_kg) : "");
      setHeight(profile.height_cm ? String(profile.height_cm) : "");
      setNotifications(profile.notification_preferences ?? {
        fasting_reminders: true,
        eating_reminders: true,
        daily_digest: true,
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    const updates: any = {
      display_name: displayName.trim() || null,
      gender,
      age: age ? parseInt(age) : null,
      weight_kg: weight ? parseFloat(weight) : null,
      height_cm: height ? parseFloat(height) : null,
    };

    const { error } = await updateProfile(updates);
    if (error) {
      toastError("Failed to save profile");
    } else {
      success("Profile updated");
    }
  };

  const handleSaveNotifications = async () => {
    const { error } = await updateNotificationPreferences(notifications);
    if (error) {
      toastError("Failed to save notification preferences");
    } else {
      success("Notification preferences updated");
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return;
    const { error } = await updateEmail(newEmail.trim());
    if (error) {
      toastError(error.message);
    } else {
      success("Confirmation email sent. Please check your inbox.");
      setNewEmail("");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toastError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError("Passwords do not match");
      return;
    }
    const { error } = await updatePassword(newPassword);
    if (error) {
      toastError(error.message);
    } else {
      success("Password updated");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const bmi = profile?.bmi;
  const bmiCategory = bmi
    ? bmi < 18.5
      ? "Underweight"
      : bmi < 25
      ? "Normal"
      : bmi < 30
      ? "Overweight"
      : "Obese"
    : null;

  return (
    <View className="mb-6">
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
      <Text style={{ color: theme === "dark" ? "#FFFFFF" : "#111827" }} className="text-lg font-bold mb-4">
        Settings
      </Text>

      {/* Profile Details Section */}
      <View className="rounded-2xl mb-3 overflow-hidden" style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "#FFFFFF", borderWidth: 1, borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}>
        <Pressable
          onPress={() => toggleSection("profile")}
          className="p-4 flex-row justify-between items-center"
        >
          <Text style={{ color: theme === "dark" ? "#FFFFFF" : "#111827" }} className="font-semibold">
            Profile Details
          </Text>
          <Text style={{ color: theme === "dark" ? "rgba(255,255,255,0.5)" : "#6B7280" }}>
            {expandedSection === "profile" ? "−" : "+"}
          </Text>
        </Pressable>

        {expandedSection === "profile" && (
          <View className="px-4 pb-4">
            <Text style={{ color: theme === "dark" ? "rgba(255,255,255,0.6)" : "#6B7280" }} className="text-xs mb-1">
              Display Name
            </Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={theme === "dark" ? "#ffffff40" : "#9CA3AF"}
              className="rounded-xl px-4 py-3 mb-3"
              style={{
                backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#F3F4F6",
                color: theme === "dark" ? "#FFFFFF" : "#111827",
              }}
            />

            <Text style={{ color: theme === "dark" ? "rgba(255,255,255,0.6)" : "#6B7280" }} className="text-xs mb-1">
              Gender
            </Text>
            <View className="flex-row gap-2 mb-3">
              {(["male", "female", "other"] as const).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(gender === g ? null : g)}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{
                    backgroundColor: gender === g
                      ? "#3B82F6"
                      : theme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "#F3F4F6",
                  }}
                >
                  <Text
                    className="text-sm capitalize font-medium"
                    style={{ color: gender === g ? "#FFFFFF" : theme === "dark" ? "rgba(255,255,255,0.6)" : "#6B7280" }}
                  >
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="flex-row gap-2 mb-3">
              <View className="flex-1">
                <Text style={{ color: theme === "dark" ? "rgba(255,255,255,0.6)" : "#6B7280" }} className="text-xs mb-1">
                  Age
                </Text>
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  placeholder="25"
                  placeholderTextColor={theme === "dark" ? "#ffffff40" : "#9CA3AF"}
                  keyboardType="numeric"
                  className="rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#F3F4F6",
                    color: theme === "dark" ? "#FFFFFF" : "#111827",
                  }}
                />
              </View>
              <View className="flex-1">
                <Text style={{ color: theme === "dark" ? "rgba(255,255,255,0.6)" : "#6B7280" }} className="text-xs mb-1">
                  Weight (kg)
                </Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="70"
                  placeholderTextColor={theme === "dark" ? "#ffffff40" : "#9CA3AF"}
                  keyboardType="numeric"
                  className="rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#F3F4F6",
                    color: theme === "dark" ? "#FFFFFF" : "#111827",
                  }}
                />
              </View>
              <View className="flex-1">
                <Text style={{ color: theme === "dark" ? "rgba(255,255,255,0.6)" : "#6B7280" }} className="text-xs mb-1">
                  Height (cm)
                </Text>
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  placeholder="175"
                  placeholderTextColor={theme === "dark" ? "#ffffff40" : "#9CA3AF"}
                  keyboardType="numeric"
                  className="rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#F3F4F6",
                    color: theme === "dark" ? "#FFFFFF" : "#111827",
                  }}
                />
              </View>
            </View>

            {bmi && (
              <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: theme === "dark" ? "rgba(59,130,246,0.1)" : "#EFF6FF" }}>
                <Text style={{ color: theme === "dark" ? "#60A5FA" : "#2563EB" }} className="text-sm font-semibold">
                  BMI: {bmi} ({bmiCategory})
                </Text>
              </View>
            )}

            <Pressable
              onPress={handleSaveProfile}
              className="rounded-xl py-3 bg-blue-500"
            >
              <Text className="text-white text-center font-semibold">
                Save Profile
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Account Section */}
      <View className="rounded-2xl mb-3 overflow-hidden" style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "#FFFFFF", borderWidth: 1, borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}>
        <Pressable
          onPress={() => toggleSection("account")}
          className="p-4 flex-row justify-between items-center"
        >
          <Text style={{ color: theme === "dark" ? "#FFFFFF" : "#111827" }} className="font-semibold">
            Account
          </Text>
          <Text style={{ color: theme === "dark" ? "rgba(255,255,255,0.5)" : "#6B7280" }}>
            {expandedSection === "account" ? "−" : "+"}
          </Text>
        </Pressable>

        {expandedSection === "account" && (
          <View className="px-4 pb-4">
            <Text style={{ color: theme === "dark" ? "rgba(255,255,255,0.6)" : "#6B7280" }} className="text-xs mb-1">
              Change Email
            </Text>
            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="new@email.com"
              placeholderTextColor={theme === "dark" ? "#ffffff40" : "#9CA3AF"}
              keyboardType="email-address"
              autoCapitalize="none"
              className="rounded-xl px-4 py-3 mb-3"
              style={{
                backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#F3F4F6",
                color: theme === "dark" ? "#FFFFFF" : "#111827",
              }}
            />
            <Pressable
              onPress={handleChangeEmail}
              className="rounded-xl py-3 mb-4"
              style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}
            >
              <Text style={{ color: theme === "dark" ? "#FFFFFF" : "#111827" }} className="text-center font-semibold">
                Update Email
              </Text>
            </Pressable>

            <Text style={{ color: theme === "dark" ? "rgba(255,255,255,0.6)" : "#6B7280" }} className="text-xs mb-1">
              Change Password
            </Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              placeholderTextColor={theme === "dark" ? "#ffffff40" : "#9CA3AF"}
              secureTextEntry
              className="rounded-xl px-4 py-3 mb-2"
              style={{
                backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#F3F4F6",
                color: theme === "dark" ? "#FFFFFF" : "#111827",
              }}
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
              placeholderTextColor={theme === "dark" ? "#ffffff40" : "#9CA3AF"}
              secureTextEntry
              className="rounded-xl px-4 py-3 mb-3"
              style={{
                backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#F3F4F6",
                color: theme === "dark" ? "#FFFFFF" : "#111827",
              }}
            />
            <Pressable
              onPress={handleChangePassword}
              className="rounded-xl py-3"
              style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}
            >
              <Text style={{ color: theme === "dark" ? "#FFFFFF" : "#111827" }} className="text-center font-semibold">
                Update Password
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Notifications Section */}
      <View className="rounded-2xl mb-3 overflow-hidden" style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "#FFFFFF", borderWidth: 1, borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}>
        <Pressable
          onPress={() => toggleSection("notifications")}
          className="p-4 flex-row justify-between items-center"
        >
          <Text style={{ color: theme === "dark" ? "#FFFFFF" : "#111827" }} className="font-semibold">
            Notifications
          </Text>
          <Text style={{ color: theme === "dark" ? "rgba(255,255,255,0.5)" : "#6B7280" }}>
            {expandedSection === "notifications" ? "−" : "+"}
          </Text>
        </Pressable>

        {expandedSection === "notifications" && (
          <View className="px-4 pb-4">
            <View className="flex-row justify-between items-center py-3 border-b" style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}>
              <Text style={{ color: theme === "dark" ? "rgba(255,255,255,0.8)" : "#374151" }} className="text-sm">
                Fasting Reminders
              </Text>
              <Switch
                value={notifications.fasting_reminders}
                onValueChange={(value) => setNotifications({ ...notifications, fasting_reminders: value })}
                trackColor={{ false: "#767577", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View className="flex-row justify-between items-center py-3 border-b" style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}>
              <Text style={{ color: theme === "dark" ? "rgba(255,255,255,0.8)" : "#374151" }} className="text-sm">
                Eating Reminders
              </Text>
              <Switch
                value={notifications.eating_reminders}
                onValueChange={(value) => setNotifications({ ...notifications, eating_reminders: value })}
                trackColor={{ false: "#767577", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View className="flex-row justify-between items-center py-3">
              <Text style={{ color: theme === "dark" ? "rgba(255,255,255,0.8)" : "#374151" }} className="text-sm">
                Daily Digest Email
              </Text>
              <Switch
                value={notifications.daily_digest}
                onValueChange={(value) => setNotifications({ ...notifications, daily_digest: value })}
                trackColor={{ false: "#767577", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Pressable
              onPress={handleSaveNotifications}
              className="rounded-xl py-3 mt-3 bg-blue-500"
            >
              <Text className="text-white text-center font-semibold">
                Save Preferences
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Appearance Section */}
      <View className="rounded-2xl mb-3 overflow-hidden" style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "#FFFFFF", borderWidth: 1, borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E5E7EB" }}>
        <Pressable
          onPress={() => toggleSection("appearance")}
          className="p-4 flex-row justify-between items-center"
        >
          <Text style={{ color: theme === "dark" ? "#FFFFFF" : "#111827" }} className="font-semibold">
            Appearance
          </Text>
          <Text style={{ color: theme === "dark" ? "rgba(255,255,255,0.5)" : "#6B7280" }}>
            {expandedSection === "appearance" ? "−" : "+"}
          </Text>
        </Pressable>

        {expandedSection === "appearance" && (
          <View className="px-4 pb-4">
            <View className="flex-row justify-between items-center py-3">
              <Text style={{ color: theme === "dark" ? "rgba(255,255,255,0.8)" : "#374151" }} className="text-sm">
                Dark Mode
              </Text>
              <Switch
                value={theme === "dark"}
                onValueChange={toggleTheme}
                trackColor={{ false: "#767577", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
