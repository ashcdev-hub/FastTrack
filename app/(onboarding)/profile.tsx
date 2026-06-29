import React, { useState, useEffect } from "react";
import { Pressable, View, Text, TextInput, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { DEFAULT_UNITS, weightUnitLabel, heightUnitLabel, parseWeightInput, parseHeightInput, displayWeight, displayHeight } from "@/lib/units";
import type { UnitPreferences } from "@/lib/units";

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, updateProfile, updateUnitPreferences } = useProfile(user?.id ?? null);
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [goalWeightInput, setGoalWeightInput] = useState("");
  const [unitPrefs, setUnitPrefs] = useState<UnitPreferences>(DEFAULT_UNITS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setAge(profile.age ? String(profile.age) : "");
      setGender(profile.gender ?? null);
      setUnitPrefs(profile.unit_preferences ?? DEFAULT_UNITS);
      if (profile.unit_preferences) {
        setWeightInput(profile.weight_kg ? displayWeight(profile.weight_kg, profile.unit_preferences) : "");
        setHeightInput(profile.height_cm ? displayHeight(profile.height_cm, profile.unit_preferences) : "");
        setGoalWeightInput(profile.goal_weight_kg ? displayWeight(profile.goal_weight_kg, profile.unit_preferences) : "");
      } else {
        setWeightInput(profile.weight_kg ? String(profile.weight_kg) : "");
        setHeightInput(profile.height_cm ? String(profile.height_cm) : "");
        setGoalWeightInput(profile.goal_weight_kg ? String(profile.goal_weight_kg) : "");
      }
    }
  }, [profile]);

  const inputStyle = { backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular" as const };
  const wUnit = weightUnitLabel(unitPrefs);
  const hUnit = heightUnitLabel(unitPrefs);

  const handleContinue = async () => {
    setSaving(true);
    const weightKg = parseWeightInput(weightInput, unitPrefs);
    const heightCm = parseHeightInput(heightInput, unitPrefs);
    const goalWeightKg = parseWeightInput(goalWeightInput, unitPrefs);
    const updates: any = {
      display_name: displayName.trim() || null,
      gender,
      age: age ? parseInt(age) : null,
      weight_kg: weightKg,
      height_cm: heightCm,
      goal_weight_kg: goalWeightKg,
    };
    await updateProfile(updates);
    await updateUnitPreferences(unitPrefs);
    setSaving(false);
    router.push("/(onboarding)/schedule");
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: c.bg }} contentContainerClassName="px-6" contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Back button */}
      <Pressable onPress={() => router.back()} className="mb-8" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-sm">
          Back
        </Text>
      </Pressable>

      <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-3xl mb-2">
        About you
      </Text>
      <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-sm mb-8">
        This helps us personalise your experience
      </Text>

      {/* Display Name */}
      <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1.5">
        Name
      </Text>
      <TextInput
        value={displayName} onChangeText={setDisplayName}
        placeholder="Your name" placeholderTextColor={c.placeholder}
        autoCapitalize="words" className="rounded-xl px-4 py-3.5 mb-4" style={inputStyle}
      />

      {/* Age */}
      <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1.5">
        Age
      </Text>
      <TextInput
        value={age} onChangeText={setAge}
        placeholder="25" placeholderTextColor={c.placeholder}
        keyboardType="numeric" className="rounded-xl px-4 py-3.5 mb-4" style={inputStyle}
      />

      {/* Gender */}
      <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1.5">
        Gender
      </Text>
      <View className="flex-row gap-2 mb-4">
        {(["male", "female", "other"] as const).map((g) => (
          <Pressable
            key={g}
            onPress={() => setGender(gender === g ? null : g)}
            className="flex-1 py-3 rounded-xl items-center"
            style={{ backgroundColor: gender === g ? ACCENT.lime : c.buttonBg }}
          >
            <Text
              className="text-sm capitalize"
              style={{ color: gender === g ? c.textOnAccent : c.textSecondary, fontFamily: "SpaceGrotesk_600SemiBold" }}
            >
              {g}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Preferred Units */}
      <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1.5">
        Preferred Units
      </Text>
      <View className="flex-row gap-2 mb-2">
        {(["kg", "lbs"] as const).map((unit) => (
          <Pressable
            key={unit}
            onPress={() => setUnitPrefs({ ...unitPrefs, weight: unit })}
            className="flex-1 py-3 rounded-xl items-center"
            style={{ backgroundColor: unitPrefs.weight === unit ? ACCENT.lime : c.buttonBg }}
          >
            <Text className="text-sm" style={{ color: unitPrefs.weight === unit ? c.textOnAccent : c.textSecondary, fontFamily: "SpaceGrotesk_600SemiBold" }}>
              {unit === "kg" ? "Kilograms" : "Pounds"}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row gap-2 mb-6">
        {(["cm", "ft"] as const).map((unit) => (
          <Pressable
            key={unit}
            onPress={() => setUnitPrefs({ ...unitPrefs, height: unit })}
            className="flex-1 py-3 rounded-xl items-center"
            style={{ backgroundColor: unitPrefs.height === unit ? ACCENT.lime : c.buttonBg }}
          >
            <Text className="text-sm" style={{ color: unitPrefs.height === unit ? c.textOnAccent : c.textSecondary, fontFamily: "SpaceGrotesk_600SemiBold" }}>
              {unit === "cm" ? "Centimeters" : "Feet/Inches"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Weight */}
      <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1.5">
        Current weight ({wUnit})
      </Text>
      <TextInput
        value={weightInput} onChangeText={setWeightInput}
        placeholder={unitPrefs.weight === "lbs" ? "154" : "70"}
        placeholderTextColor={c.placeholder}
        keyboardType="numeric" className="rounded-xl px-4 py-3.5 mb-4" style={inputStyle}
      />

      {/* Height */}
      <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1.5">
        Height ({hUnit})
      </Text>
      <TextInput
        value={heightInput} onChangeText={setHeightInput}
        placeholder={unitPrefs.height === "ft" ? "5'9\"" : "175"}
        placeholderTextColor={c.placeholder}
        keyboardType={unitPrefs.height === "ft" ? "default" : "numeric"}
        className="rounded-xl px-4 py-3.5 mb-4" style={inputStyle}
      />

      {/* Goal Weight */}
      <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1.5">
        Goal weight ({wUnit})
      </Text>
      <TextInput
        value={goalWeightInput} onChangeText={setGoalWeightInput}
        placeholder={unitPrefs.weight === "lbs" ? "143" : "75"}
        placeholderTextColor={c.placeholder}
        keyboardType="numeric" className="rounded-xl px-4 py-3.5 mb-8" style={inputStyle}
      />

      {/* Continue */}
      <Pressable
        onPress={handleContinue} disabled={saving}
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
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT.lime }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.textFaint }} />
      </View>
    </ScrollView>
  );
}
