import React, { useState, useEffect } from "react";
import { Pressable, View, Text, TextInput, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile(user?.id ?? null);
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | null>(null);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setAge(profile.age ? String(profile.age) : "");
      setGender(profile.gender ?? null);
      setWeight(profile.weight_kg ? String(profile.weight_kg) : "");
      setHeight(profile.height_cm ? String(profile.height_cm) : "");
      setGoalWeight(profile.goal_weight_kg ? String(profile.goal_weight_kg) : "");
    }
  }, [profile]);

  const inputStyle = { backgroundColor: c.inputBg, color: c.text, fontFamily: "PlusJakartaSans_500Medium" as const };

  const handleContinue = async () => {
    setSaving(true);
    const updates: any = {
      display_name: displayName.trim() || null,
      gender,
      age: age ? parseInt(age) : null,
      weight_kg: weight ? parseFloat(weight) : null,
      height_cm: height ? parseFloat(height) : null,
      goal_weight_kg: goalWeight ? parseFloat(goalWeight) : null,
    };
    await updateProfile(updates);
    setSaving(false);
    router.push("/(onboarding)/schedule");
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: c.bg }} contentContainerClassName="px-6" contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }}>
      {/* Back button */}
      <Pressable onPress={() => router.back()} className="mb-8" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">
          Back
        </Text>
      </Pressable>

      <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-3xl mb-2">
        About you
      </Text>
      <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-sm mb-8">
        This helps us personalise your experience
      </Text>

      {/* Display Name */}
      <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-1.5">
        Name
      </Text>
      <TextInput
        value={displayName} onChangeText={setDisplayName}
        placeholder="Your name" placeholderTextColor={c.placeholder}
        autoCapitalize="words" className="rounded-xl px-4 py-3.5 mb-4" style={inputStyle}
      />

      {/* Age */}
      <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-1.5">
        Age
      </Text>
      <TextInput
        value={age} onChangeText={setAge}
        placeholder="25" placeholderTextColor={c.placeholder}
        keyboardType="numeric" className="rounded-xl px-4 py-3.5 mb-4" style={inputStyle}
      />

      {/* Gender */}
      <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-1.5">
        Gender
      </Text>
      <View className="flex-row gap-2 mb-4">
        {(["male", "female", "other"] as const).map((g) => (
          <Pressable
            key={g}
            onPress={() => setGender(gender === g ? null : g)}
            className="flex-1 py-3 rounded-xl items-center"
            style={{ backgroundColor: gender === g ? ACCENT.mint : c.buttonBg }}
          >
            <Text
              className="text-sm capitalize"
              style={{ color: gender === g ? c.textOnAccent : c.textSecondary, fontFamily: "PlusJakartaSans_600SemiBold" }}
            >
              {g}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Weight */}
      <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-1.5">
        Current weight (kg)
      </Text>
      <TextInput
        value={weight} onChangeText={setWeight}
        placeholder="70" placeholderTextColor={c.placeholder}
        keyboardType="numeric" className="rounded-xl px-4 py-3.5 mb-4" style={inputStyle}
      />

      {/* Height */}
      <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-1.5">
        Height (cm)
      </Text>
      <TextInput
        value={height} onChangeText={setHeight}
        placeholder="175" placeholderTextColor={c.placeholder}
        keyboardType="numeric" className="rounded-xl px-4 py-3.5 mb-4" style={inputStyle}
      />

      {/* Goal Weight */}
      <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-1.5">
        Goal weight (kg)
      </Text>
      <TextInput
        value={goalWeight} onChangeText={setGoalWeight}
        placeholder="75" placeholderTextColor={c.placeholder}
        keyboardType="numeric" className="rounded-xl px-4 py-3.5 mb-8" style={inputStyle}
      />

      {/* Continue */}
      <Pressable
        onPress={handleContinue} disabled={saving}
        className="rounded-xl py-4"
        style={{ backgroundColor: ACCENT.mint }}
      >
        <Text style={{ color: c.textOnAccent, fontFamily: "PlusJakartaSans_700Bold" }} className="text-center text-lg">
          Continue
        </Text>
      </Pressable>

      {/* Step indicator */}
      <View className="flex-row gap-2 mt-10 justify-center">
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT.mint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
      </View>
    </ScrollView>
  );
}
