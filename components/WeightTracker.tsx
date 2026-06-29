import React, { useState } from "react";
import { Pressable, View, Text, TextInput, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import { displayWeight, displayWeightChange, weightUnitLabel, parseWeightInput, DEFAULT_UNITS } from "@/lib/units";
import type { WeightLogEntry } from "@/lib/types";
import type { UnitPreferences } from "@/lib/units";

type WeightTrackerProps = {
  entries: WeightLogEntry[];
  currentWeight: number | null;
  weightChange: number | null;
  onAddWeight: (kg: number) => Promise<{ error: Error | null }>;
  onDeleteWeight: (id: string) => Promise<{ error: Error | null }>;
  loading: boolean;
  unitPrefs?: UnitPreferences;
};

export function WeightTracker({ entries, currentWeight, weightChange, onAddWeight, onDeleteWeight, loading, unitPrefs = DEFAULT_UNITS }: WeightTrackerProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const { toast, success, error: toastError } = useToast();
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const unitLabel = weightUnitLabel(unitPrefs);

  const handleLog = async () => {
    const weightKg = parseWeightInput(inputValue, unitPrefs);
    if (weightKg === null || weightKg > 500) return;
    setSaving(true);
    const { error } = await onAddWeight(weightKg);
    if (error) toastError("Failed to log weight");
    else { success("Weight logged"); setInputValue(""); }
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await onDeleteWeight(deleteTarget);
    setDeleteTarget(null);
  };

  const recentEntries = entries.slice(0, 5);

  return (
    <View>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
      <View className="flex-row items-center justify-between mb-4">
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-3xl">
            {displayWeight(currentWeight, unitPrefs)}
          </Text>
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-sm ml-1">{unitLabel}</Text>
        </View>
        {weightChange !== null && weightChange !== 0 && (
          <View className="items-end">
            <Text style={{ color: weightChange < 0 ? accent.lime : ACCENT.rose, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-lg">
              {weightChange < 0 ? "↓" : "↑"} {displayWeightChange(weightChange, unitPrefs)} {unitLabel}
            </Text>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs">this month</Text>
          </View>
        )}
      </View>

      <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-xs mb-2 tracking-widest">
        LOG TODAY&apos;S WEIGHT
      </Text>
      <View className="flex-row gap-2 mb-5">
        <View className="flex-1 relative">
          <TextInput
            value={inputValue} onChangeText={setInputValue}
            placeholder={currentWeight !== null ? displayWeight(currentWeight, unitPrefs) : "Enter weight"}
            placeholderTextColor={c.placeholder} keyboardType="numeric"
            className="rounded-xl px-4 py-3 pr-10"
            style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular" }}
          />
          <Text className="absolute text-sm" style={{ right: 12, top: 12, color: c.textMuted, fontFamily: "Inter_400Regular" }}>{unitLabel}</Text>
        </View>
        <Pressable
          onPress={handleLog} disabled={!inputValue || parseFloat(inputValue) <= 0 || saving}
          className="rounded-xl px-5 py-3"
          style={{ backgroundColor: inputValue && parseFloat(inputValue) > 0 && !saving ? accent.lime : c.buttonBg }}
        >
          <Text style={{
            fontFamily: "Inter_700Bold",
            color: inputValue && parseFloat(inputValue) > 0 && !saving ? c.textOnAccent : c.textMuted,
          }}>
            {saving ? "..." : "Log"}
          </Text>
        </Pressable>
      </View>

      {recentEntries.length > 0 && (
        <>
          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-xs mb-2 tracking-widest">
            RECENT ENTRIES
          </Text>
          {recentEntries.map((entry) => {
            const date = new Date(entry.logged_at);
            const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const isToday = new Date().toDateString() === date.toDateString();
            return (
              <View key={entry.id}>
                <View className="flex-row items-center justify-between py-2" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
                  <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-sm">
                    {isToday ? "Today" : dateStr}
                  </Text>
                  <View className="flex-row items-center gap-3">
                    <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">
                      {displayWeight(entry.weight_kg, unitPrefs)} {unitLabel}
                    </Text>
                    <Pressable onPress={() => setDeleteTarget(entry.id)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      accessibilityRole="button" accessibilityLabel="Delete weight entry">
                      <MaterialCommunityIcons name="delete-outline" size={18} color={c.textMuted} />
                    </Pressable>
                  </View>
                </View>
                {}
              </View>
            );
          })}
        </>
      )}

      {entries.length === 0 && !loading && (
        <View className="items-center py-4">
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-sm">
            Log your first weight entry above
          </Text>
        </View>
      )}
      {/* Delete Confirmation Modal */}
      <Modal visible={deleteTarget !== null} transparent animationType="slide" onRequestClose={() => setDeleteTarget(null)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setDeleteTarget(null)}>
          <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 8 }}>
              Delete this entry?
            </Text>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 20 }}>
              This record will be permanently removed.
            </Text>
            <View className="flex-row gap-3">
              <Pressable onPress={() => setDeleteTarget(null)} className="flex-1 py-3.5 rounded-xl items-center" style={{ backgroundColor: c.buttonBg }}>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmDelete} className="flex-1 py-3.5 rounded-xl items-center" style={{ backgroundColor: ACCENT.rose }}>
                <Text style={{ color: c.textOnDark, fontFamily: "Inter_700Bold" }}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
