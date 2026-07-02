import React, { useState } from "react";
import { Pressable, View, Text, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import type { PeriodSettings } from "@/lib/types";

type PeriodSettingsModalProps = {
  visible: boolean;
  settings: PeriodSettings;
  onSave: (settings: Partial<PeriodSettings>) => Promise<void>;
  onClose: () => void;
};

export function PeriodSettingsModal({ visible, settings, onSave, onClose }: PeriodSettingsModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const [cycleLength, setCycleLength] = useState(settings.cycle_length);
  const [periodDuration, setPeriodDuration] = useState(settings.period_duration);
  const [lutealLength, setLutealLength] = useState(settings.luteal_phase_length);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ cycle_length: cycleLength, period_duration: periodDuration, luteal_phase_length: lutealLength });
    setSaving(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={onClose}>
        <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
          <View className="flex-row justify-between items-center mb-5">
            <Pressable onPress={onClose}>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15 }}>Cancel</Text>
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20 }}>Cycle Settings</Text>
            <Pressable onPress={handleSave} disabled={saving}>
              <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold", fontSize: 15, opacity: saving ? 0.5 : 1 }}>Save</Text>
            </Pressable>
          </View>

          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
            Cycle Length (days)
          </Text>
          <View className="flex-row items-center justify-center gap-4 mb-4">
            <Pressable onPress={() => setCycleLength(Math.max(21, cycleLength - 1))} className="p-2 rounded-lg" style={{ backgroundColor: c.buttonBg }}>
              <MaterialCommunityIcons name="minus" size={20} color={c.text} />
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 28, minWidth: 50, textAlign: "center" }}>
              {cycleLength}
            </Text>
            <Pressable onPress={() => setCycleLength(Math.min(45, cycleLength + 1))} className="p-2 rounded-lg" style={{ backgroundColor: c.buttonBg }}>
              <MaterialCommunityIcons name="plus" size={20} color={c.text} />
            </Pressable>
          </View>
          <View className="flex-row gap-2 mb-5 justify-center">
            {[{ label: "24", value: 24 }, { label: "28", value: 28 }, { label: "32", value: 32 }].map((p) => (
              <Pressable key={p.value} onPress={() => setCycleLength(p.value)}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: cycleLength === p.value ? accent.limeBg : c.buttonBg, borderWidth: 1, borderColor: cycleLength === p.value ? accent.lime + "44" : "transparent" }}>
                <Text style={{ color: cycleLength === p.value ? accent.lime : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 14 }}>{p.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
            Period Duration (days)
          </Text>
          <View className="flex-row items-center justify-center gap-4 mb-4">
            <Pressable onPress={() => setPeriodDuration(Math.max(2, periodDuration - 1))} className="p-2 rounded-lg" style={{ backgroundColor: c.buttonBg }}>
              <MaterialCommunityIcons name="minus" size={20} color={c.text} />
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 28, minWidth: 50, textAlign: "center" }}>
              {periodDuration}
            </Text>
            <Pressable onPress={() => setPeriodDuration(Math.min(10, periodDuration + 1))} className="p-2 rounded-lg" style={{ backgroundColor: c.buttonBg }}>
              <MaterialCommunityIcons name="plus" size={20} color={c.text} />
            </Pressable>
          </View>
          <View className="flex-row gap-2 mb-5 justify-center">
            {[{ label: "3d", value: 3 }, { label: "5d", value: 5 }, { label: "7d", value: 7 }].map((p) => (
              <Pressable key={p.value} onPress={() => setPeriodDuration(p.value)}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: periodDuration === p.value ? accent.roseBg : c.buttonBg, borderWidth: 1, borderColor: periodDuration === p.value ? accent.rose + "44" : "transparent" }}>
                <Text style={{ color: periodDuration === p.value ? accent.rose : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 14 }}>{p.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
            Luteal Phase (days)
          </Text>
          <View className="flex-row items-center justify-center gap-4 mb-4">
            <Pressable onPress={() => setLutealLength(Math.max(10, lutealLength - 1))} className="p-2 rounded-lg" style={{ backgroundColor: c.buttonBg }}>
              <MaterialCommunityIcons name="minus" size={20} color={c.text} />
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 28, minWidth: 50, textAlign: "center" }}>
              {lutealLength}
            </Text>
            <Pressable onPress={() => setLutealLength(Math.min(17, lutealLength + 1))} className="p-2 rounded-lg" style={{ backgroundColor: c.buttonBg }}>
              <MaterialCommunityIcons name="plus" size={20} color={c.text} />
            </Pressable>
          </View>
          <View className="flex-row gap-2 mb-5 justify-center">
            {[{ label: "12", value: 12 }, { label: "14", value: 14 }, { label: "16", value: 16 }].map((p) => (
              <Pressable key={p.value} onPress={() => setLutealLength(p.value)}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: lutealLength === p.value ? accent.amberBg : c.buttonBg, borderWidth: 1, borderColor: lutealLength === p.value ? accent.amber + "44" : "transparent" }}>
                <Text style={{ color: lutealLength === p.value ? accent.amber : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 14 }}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
