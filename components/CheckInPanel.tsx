import React, { useState } from "react";
import { Pressable, View, Text, TextInput } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import ArrowRight01Icon from "@hugeicons/core-free-icons/dist/esm/ArrowRight01Icon";
import Sad01Icon from "@hugeicons/core-free-icons/dist/esm/Sad01Icon";
import FrownIcon from "@hugeicons/core-free-icons/dist/esm/FrownIcon";
import MehIcon from "@hugeicons/core-free-icons/dist/esm/MehIcon";
import SmileIcon from "@hugeicons/core-free-icons/dist/esm/SmileIcon";
import Happy01Icon from "@hugeicons/core-free-icons/dist/esm/Happy01Icon";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";

const MOODS = [
  { value: 1, label: "Terrible", icon: Sad01Icon, color: ACCENT.rose },
  { value: 2, label: "Bad", icon: FrownIcon, color: ACCENT.coral },
  { value: 3, label: "Okay", icon: MehIcon, color: ACCENT.amber },
  { value: 4, label: "Good", icon: SmileIcon, color: ACCENT.mint },
  { value: 5, label: "Great", icon: Happy01Icon, color: ACCENT.mintLight },
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

  const selectedMoodData = MOODS.find((m) => m.value === selectedMood);

  if (submitted) {
    return (
      <View className="rounded-2xl p-4" style={{ backgroundColor: ACCENT.mintBg, borderWidth: 1, borderColor: ACCENT.mintBorder }}>
        <Text style={{ color: ACCENT.mint, fontFamily: "PlusJakartaSans_500Medium" }} className="text-center">
          Check-in saved
        </Text>
      </View>
    );
  }

  return (
    <View className="rounded-2xl p-4" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
      <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs mb-3 tracking-widest">
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
                <HugeiconsIcon
                  icon={m.icon}
                  size={28}
                  color={isSelected ? m.color : c.textFaint}
                  strokeWidth={1.5}
                />
              </View>
              <Text
                style={{
                  color: isSelected ? m.color : c.textMuted,
                  fontFamily: isSelected ? "PlusJakartaSans_600SemiBold" : "PlusJakartaSans_400Regular",
                }}
                className="text-[10px]"
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
          style={{ backgroundColor: c.cardBgAlt, color: c.text, fontFamily: "PlusJakartaSans_400Regular" }}
          multiline
          maxLength={280}
        />
        <Pressable
          onPress={handleSubmit}
          disabled={selectedMood === null}
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: selectedMood !== null ? selectedMoodData?.color ?? ACCENT.mint : c.cardBgAlt,
          }}
        >
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={18}
            color={selectedMood !== null ? c.textOnAccent : c.textMuted}
            strokeWidth={1.5}
          />
        </Pressable>
      </View>
    </View>
  );
}
