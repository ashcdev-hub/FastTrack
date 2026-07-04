import React, { useState } from "react";
import { Pressable, View, Text, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";

const MOODS = [
  { value: 1, label: "Terrible", icon: "emoticon-sad-outline" as const, color: ACCENT.rose },
  { value: 2, label: "Bad", icon: "emoticon-sad" as const, color: ACCENT.coral },
  { value: 3, label: "Okay", icon: "emoticon-neutral" as const, color: ACCENT.amber },
  { value: 4, label: "Good", icon: "emoticon-happy-outline" as const, color: ACCENT.lime },
  { value: 5, label: "Great", icon: "emoticon-happy" as const, color: ACCENT.cyan },
];

type CheckInPanelProps = {
  phase: "fasting" | "eating";
  onSubmit: (mood: number, note: string) => void;
};

export function CheckInPanel({ phase, onSubmit }: CheckInPanelProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
// accent defined below
// accent defined below
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedMood === null) return;
    onSubmit(selectedMood, note);
    setSelectedMood(null);
    setNote("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  const selectedMoodData = MOODS.find((m) => m.value === selectedMood);

  if (submitted) {
    return (
      <View className="rounded-xl p-4" style={{ backgroundColor: ACCENT.limeBg, borderWidth: 1, borderColor: ACCENT.limeBorder }}>
        <Text style={{ color: ACCENT.lime, fontFamily: "Inter_700Bold", textAlign: "center" }}>
          Check-in saved
        </Text>
      </View>
    );
  }

  return (
    <View className="glass-bg glass-border p-5">
      <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>
        HOW ARE YOU FEELING?
      </Text>

      <View className="flex-row justify-between mb-4">
        {MOODS.map((m) => {
          const isSelected = selectedMood === m.value;
          return (
            <Pressable
              key={m.value}
              onPress={() => setSelectedMood(m.value)}
              className="items-center"
              style={{ minWidth: 52 }}
              accessibilityRole="button"
              accessibilityLabel={`${m.label} mood`}
              accessibilityState={{ selected: isSelected }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isSelected ? `${m.color}20` : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 6,
                }}
              >
                <MaterialCommunityIcons
                  name={m.icon}
                  size={28}
                  color={isSelected ? m.color : c.textFaint}
                />
              </View>
              <Text
                style={{
                  color: isSelected ? m.color : c.textMuted,
                  fontFamily: isSelected ? "SpaceGrotesk_700Bold" : "Inter_400Regular",
                  fontSize: 10,
                }}
              >
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row items-center gap-2">
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={phase === "fasting" ? "How's the fast going?" : "How's the meal?"}
          placeholderTextColor={c.placeholder}
          className="flex-1 rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: c.cardBgAlt, color: c.text, fontFamily: "Inter_400Regular" }}
          multiline
          maxLength={280}
        />
        <Pressable
          onPress={handleSubmit}
          disabled={selectedMood === null}
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: selectedMood !== null ? selectedMoodData?.color ?? ACCENT.lime : c.cardBgAlt,
          }}
          accessibilityRole="button"
          accessibilityLabel="Submit check-in"
          accessibilityState={{ disabled: selectedMood === null }}
        >
          <MaterialCommunityIcons
            name="arrow-right"
            size={18}
            color={selectedMood !== null ? c.textOnAccent : c.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
}
