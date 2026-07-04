import React, { useState, useEffect } from "react";
import { Pressable, View, Text, TextInput, ScrollView, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import type { PeriodLogEntry } from "@/lib/types";

type PeriodLogModalProps = {
  visible: boolean;
  dateStr: string;
  entry: PeriodLogEntry | null;
  predictedFertile?: boolean;
  predictedOvulation?: boolean;
  onSave: (data: Partial<PeriodLogEntry>) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
};

const FLOW_OPTIONS = [
  { value: "spotlight" as const, label: "Spotting", icon: "water" as const },
  { value: "light" as const, label: "Light", icon: "water" as const },
  { value: "medium" as const, label: "Medium", icon: "water" as const },
  { value: "heavy" as const, label: "Heavy", icon: "water" as const },
];

const CRAMPS_OPTIONS = [
  { value: "none" as const, label: "None" },
  { value: "mild" as const, label: "Mild" },
  { value: "moderate" as const, label: "Moderate" },
  { value: "severe" as const, label: "Severe" },
];

const MOOD_OPTIONS = [
  { value: "happy" as const, label: "Happy", icon: "emoticon-happy" as const },
  { value: "neutral" as const, label: "Neutral", icon: "emoticon-neutral" as const },
  { value: "irritable" as const, label: "Irritable", icon: "emoticon-angry" as const },
  { value: "sad" as const, label: "Sad", icon: "emoticon-sad" as const },
  { value: "anxious" as const, label: "Anxious", icon: "emoticon-frown" as const },
  { value: "energetic" as const, label: "Energetic", icon: "emoticon-excited" as const },
  { value: "fatigued" as const, label: "Fatigued", icon: "emoticon-tired" as const },
];

const ENERGY_OPTIONS = [
  { value: "high" as const, label: "High", icon: "battery" as const },
  { value: "normal" as const, label: "Normal", icon: "battery-medium" as const },
  { value: "low" as const, label: "Low", icon: "battery-low" as const },
];

export function PeriodLogModal({ visible, dateStr, entry, predictedFertile, predictedOvulation, onSave, onDelete, onClose }: PeriodLogModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);

  const [flow, setFlow] = useState<string | null>(entry?.flow_intensity ?? null);
  const [cramps, setCramps] = useState<string | null>(entry?.cramps ?? null);
  const [mood, setMood] = useState<string | null>(entry?.mood ?? null);
  const [energy, setEnergy] = useState<string | null>(entry?.energy ?? null);
  const [headache, setHeadache] = useState(entry?.headache ?? false);
  const [bloating, setBloating] = useState(entry?.bloating ?? false);
  const [cravings, setCravings] = useState(entry?.cravings ?? false);
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const hasFlow = !!entry?.flow_intensity;

  useEffect(() => {
    setFlow(entry?.flow_intensity ?? null);
    setCramps(entry?.cramps ?? null);
    setMood(entry?.mood ?? null);
    setEnergy(entry?.energy ?? null);
    setHeadache(entry?.headache ?? false);
    setBloating(entry?.bloating ?? false);
    setCravings(entry?.cravings ?? false);
    setNotes(entry?.notes ?? "");
    setShowDelete(false);
  }, [dateStr, entry]);

  const formattedDate = (() => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  })();

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      flow_intensity: flow as any || null,
      cramps: cramps as any || null,
      mood: mood as any || null,
      energy: energy as any || null,
      headache,
      bloating,
      cravings,
      notes: notes.trim() || null,
    });
    setSaving(false);
    onClose();
  };

  const handleMarkPeriodDay = async () => {
    setSaving(true);
    setFlow("medium");
    try {
      await onSave({
        flow_intensity: "medium",
        cramps: cramps as any || null,
        mood: mood as any || null,
        energy: energy as any || null,
        headache,
        bloating,
        cravings,
        notes: notes.trim() || null,
      });
    } catch (e) {
      console.error("Failed to save period day:", e);
    }
    setSaving(false);
    onClose();
  };

  const handleEndPeriod = async () => {
    setSaving(true);
    setFlow(null);
    try {
      await onSave({
        flow_intensity: null,
        cramps: cramps as any || null,
        mood: mood as any || null,
        energy: energy as any || null,
        headache,
        bloating,
        cravings,
        notes: notes.trim() || null,
      });
    } catch (e) {
      console.error("Failed to end period:", e);
    }
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    setSaving(true);
    await onDelete();
    setSaving(false);
    setShowDelete(false);
    onClose();
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={onClose}>
        <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl" style={{ backgroundColor: c.elevated, maxHeight: "85%" }}>
          <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
            <View className="flex-row justify-between items-center mb-5">
              <Pressable onPress={onClose}>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15 }}>Cancel</Text>
              </Pressable>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20 }}>{formattedDate}</Text>
              <Pressable onPress={handleSave} disabled={saving}>
                <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold", fontSize: 15, opacity: saving ? 0.5 : 1 }}>Save</Text>
              </Pressable>
            </View>

            {predictedFertile && (
              <View className="flex-row items-center gap-2 px-3 py-2 rounded-lg mb-4" style={{ backgroundColor: accent.cyanBg }}>
                <MaterialCommunityIcons name="information" size={16} color={accent.cyan} />
                <Text style={{ color: accent.cyan, fontFamily: "Inter_400Regular", fontSize: 12 }}>Predicted fertile window</Text>
              </View>
            )}
            {predictedOvulation && (
              <View className="flex-row items-center gap-2 px-3 py-2 rounded-lg mb-4" style={{ backgroundColor: accent.cyanBg }}>
                <MaterialCommunityIcons name="star" size={16} color={accent.cyan} />
                <Text style={{ color: accent.cyan, fontFamily: "Inter_400Regular", fontSize: 12 }}>Predicted ovulation day</Text>
              </View>
            )}

            {hasFlow ? (
              <>
                <View className="flex-row items-center justify-between mb-4">
                  <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>
                    Period Day
                  </Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={handleEndPeriod}
                      className="py-1.5 px-3 rounded-lg"
                      style={{ backgroundColor: ACCENT.roseBg }}
                    >
                      <Text style={{ color: ACCENT.rose, fontFamily: "Inter_700Bold", fontSize: 12 }}>End Period</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleDelete}
                      className="py-1.5 px-3 rounded-lg"
                      style={{ backgroundColor: c.buttonBg }}
                    >
                      <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 8 }}>
                  How heavy is the flow?
                </Text>
                <View className="flex-row gap-2 mb-5">
                  {FLOW_OPTIONS.map((o) => {
                    const active = flow === o.value;
                    return (
                      <Pressable
                        key={o.value}
                        onPress={() => setFlow(active ? null : o.value)}
                        className="flex-1 items-center py-3 rounded-xl flex-row justify-center gap-1"
                        style={{ backgroundColor: active ? accent.roseBg : c.buttonBg, borderWidth: 1, borderColor: active ? accent.rose + "44" : "transparent" }}
                      >
                        <MaterialCommunityIcons
                          name={o.icon as any}
                          size={16}
                          color={active ? accent.rose : c.textMuted}
                        />
                        <Text style={{ color: active ? accent.rose : c.textMuted, fontFamily: active ? "Inter_700Bold" : "Inter_400Regular", fontSize: 12 }}>
                          {o.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
                  Cramps
                </Text>
                <View className="flex-row gap-2 mb-5">
                  {CRAMPS_OPTIONS.map((o) => {
                    const active = cramps === o.value;
                    return (
                      <Pressable
                        key={o.value}
                        onPress={() => setCramps(active ? null : o.value)}
                        className="flex-1 items-center py-3 rounded-xl"
                        style={{ backgroundColor: active ? accent.roseBg : c.buttonBg, borderWidth: 1, borderColor: active ? accent.rose + "44" : "transparent" }}
                      >
                        <Text style={{ color: active ? accent.rose : c.textMuted, fontFamily: active ? "Inter_700Bold" : "Inter_400Regular", fontSize: 12 }}>
                          {o.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
                  Mood
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-5">
                  {MOOD_OPTIONS.map((o) => {
                    const active = mood === o.value;
                    return (
                      <Pressable
                        key={o.value}
                        onPress={() => setMood(active ? null : o.value)}
                        className="flex-row items-center gap-1 px-3 py-2 rounded-xl"
                        style={{ backgroundColor: active ? accent.limeBg : c.buttonBg, borderWidth: 1, borderColor: active ? accent.lime + "44" : "transparent" }}
                      >
                        <MaterialCommunityIcons name={o.icon as any} size={16} color={active ? accent.lime : c.textMuted} />
                        <Text style={{ color: active ? accent.lime : c.textMuted, fontFamily: active ? "Inter_700Bold" : "Inter_400Regular", fontSize: 12 }}>
                          {o.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
                  Energy
                </Text>
                <View className="flex-row gap-2 mb-5">
                  {ENERGY_OPTIONS.map((o) => {
                    const active = energy === o.value;
                    return (
                      <Pressable
                        key={o.value}
                        onPress={() => setEnergy(active ? null : o.value)}
                        className="flex-1 items-center py-3 rounded-xl flex-row justify-center gap-1"
                        style={{ backgroundColor: active ? accent.limeBg : c.buttonBg, borderWidth: 1, borderColor: active ? accent.lime + "44" : "transparent" }}
                      >
                        <MaterialCommunityIcons name={o.icon as any} size={16} color={active ? accent.lime : c.textMuted} />
                        <Text style={{ color: active ? accent.lime : c.textMuted, fontFamily: active ? "Inter_700Bold" : "Inter_400Regular", fontSize: 12 }}>
                          {o.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
                  Quick log
                </Text>
                <View className="flex-row gap-2 mb-5">
                  {([
                    { key: "headache" as const, label: "Headache", icon: "brain", value: headache },
                    { key: "bloating" as const, label: "Bloating", icon: "arrow-expand-all", value: bloating },
                    { key: "cravings" as const, label: "Cravings", icon: "food-variant", value: cravings },
                  ] as const).map((item) => (
                    <Pressable
                      key={item.key}
                      onPress={() => {
                        if (item.key === "headache") setHeadache(!headache);
                        else if (item.key === "bloating") setBloating(!bloating);
                        else if (item.key === "cravings") setCravings(!cravings);
                      }}
                      className="flex-1 items-center py-3 rounded-xl flex-row justify-center gap-1"
                      style={{ backgroundColor: item.value ? accent.roseBg : c.buttonBg, borderWidth: 1, borderColor: item.value ? accent.rose + "44" : "transparent" }}
                    >
                      <MaterialCommunityIcons name={item.icon as any} size={16} color={item.value ? accent.rose : c.textMuted} />
                      <Text style={{ color: item.value ? accent.rose : c.textMuted, fontFamily: item.value ? "Inter_700Bold" : "Inter_400Regular", fontSize: 12 }}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add a note..."
                  placeholderTextColor={c.placeholder}
                  className="rounded-xl px-4 py-3 mb-5"
                  style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 14, borderWidth: 1, borderColor: c.inputBorder }}
                  multiline
                  maxLength={280}
                />

                <Pressable onPress={() => setShowDelete(true)} className="w-full py-3 rounded-xl items-center mb-3" style={{ backgroundColor: ACCENT.roseBg, borderWidth: 1, borderColor: ACCENT.roseBorder }}>
                  <Text style={{ color: ACCENT.rose, fontFamily: "Inter_700Bold", fontSize: 13 }}>Delete All Data</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 0.5, marginBottom: 12, textTransform: "uppercase" }}>
                  Is this a period day?
                </Text>
                <Pressable
                  onPress={handleMarkPeriodDay}
                  className="w-full py-3 rounded-xl items-center"
                  style={{ backgroundColor: accent.roseBg, borderWidth: 1, borderColor: accent.rose + "44" }}
                  disabled={saving}
                >
                  <Text style={{ color: saving ? c.textMuted : accent.rose, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                    {saving ? "Saving..." : "Mark as Period Day"}
                  </Text>
                </Pressable>
              </>
            )}
          </ScrollView>

          {showDelete && (
            <View className="px-6 pb-6">
              <View className="rounded-xl p-4 mb-3" style={{ backgroundColor: ACCENT.roseBg, borderWidth: 1, borderColor: ACCENT.roseBorder }}>
                <Text style={{ color: ACCENT.rose, fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 4 }}>Clear all data for this day?</Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>This will remove all logged symptoms for {formattedDate}.</Text>
              </View>
              <View className="flex-row gap-3">
                <Pressable onPress={() => setShowDelete(false)} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: c.buttonBg }}>
                  <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>Keep</Text>
                </Pressable>
                <Pressable onPress={handleDelete} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: ACCENT.rose }}>
                  <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold" }}>Clear</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
