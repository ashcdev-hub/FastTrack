import React, { useState } from "react";
import { Pressable, View, Text, TextInput } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import ArrowRight01Icon from "@hugeicons/core-free-icons/dist/esm/ArrowRight01Icon";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";

const MOODS = [
  { value: 1, emoji: "😫", label: "Terrible" },
  { value: 2, emoji: "😔", label: "Bad" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🤩", label: "Great" },
];

type CheckInPanelProps = {
  phase: "fasting" | "eating";
  onSubmit: (mood: number, note: string) => void;
};

export function CheckInPanel({ phase, onSubmit }: CheckInPanelProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
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

  if (submitted) {
    return (
      <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)" }}>
        <Text style={{ color: "#34D399" }} className="text-center font-medium">
          Check-in saved ✓
        </Text>
      </View>
    );
  }

  return (
    <View className="rounded-2xl p-4" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
      <Text style={{ color: c.textSecondary }} className="text-xs font-bold mb-3 tracking-wider">
        HOW ARE YOU FEELING?
      </Text>

      <View className="flex-row justify-between mb-4">
        {MOODS.map((m) => (
          <Pressable
            key={m.value}
            onPress={() => setSelectedMood(m.value)}
            className="items-center"
            style={{
              padding: 8,
              borderRadius: 12,
              backgroundColor: selectedMood === m.value ? (theme === "dark" ? "rgba(255,255,255,0.15)" : "#DBEAFE") : "transparent",
              borderWidth: selectedMood === m.value ? 1 : 0,
              borderColor: selectedMood === m.value ? (theme === "dark" ? "rgba(255,255,255,0.3)" : "#93C5FD") : "transparent",
              minWidth: 52,
            }}
          >
            <Text className="text-2xl mb-1">{m.emoji}</Text>
            <Text style={{ color: selectedMood === m.value ? c.text : c.textMuted }} className="text-[10px]">
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row items-center gap-2">
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={phase === "fasting" ? "How's the fast going?" : "How's the meal?"}
          placeholderTextColor={c.placeholder}
          className="flex-1 rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: c.cardBgAlt, color: c.text }}
          multiline
          maxLength={280}
        />
        <Pressable
          onPress={handleSubmit}
          disabled={selectedMood === null}
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: selectedMood !== null ? "#3B82F6" : c.cardBgAlt,
          }}
        >
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={18}
            color={selectedMood !== null ? "#FFFFFF" : c.textMuted}
            strokeWidth={1.5}
          />
        </Pressable>
      </View>
    </View>
  );
}
