import React, { useState } from "react";
import { Pressable, View, Text, TextInput, Alert } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import type { WeightLogEntry } from "@/lib/types";

type WeightTrackerProps = {
  entries: WeightLogEntry[];
  currentWeight: number | null;
  weightChange: number | null;
  onAddWeight: (kg: number) => Promise<{ error: Error | null }>;
  onDeleteWeight: (id: string) => Promise<{ error: Error | null }>;
  loading: boolean;
};

export function WeightTracker({ entries, currentWeight, weightChange, onAddWeight, onDeleteWeight, loading }: WeightTrackerProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const { toast, success, error: toastError } = useToast();
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  const handleLog = async () => {
    const weight = parseFloat(inputValue);
    if (isNaN(weight) || weight <= 0 || weight > 500) return;
    setSaving(true);
    const { error } = await onAddWeight(weight);
    if (error) toastError("Failed to log weight");
    else { success("Weight logged"); setInputValue(""); }
    setSaving(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Entry", "Remove this weight entry?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await onDeleteWeight(id); } },
    ]);
  };

  const recentEntries = entries.slice(0, 5);

  return (
    <View>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-3xl">
            {currentWeight !== null ? `${currentWeight.toFixed(1)}` : "—"}
          </Text>
          <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-sm">kg</Text>
        </View>
        {weightChange !== null && weightChange !== 0 && (
          <View className="items-end">
            <Text style={{ color: weightChange < 0 ? ACCENT.mint : ACCENT.rose, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-lg">
              {weightChange < 0 ? "↓" : "↑"} {Math.abs(weightChange).toFixed(1)} kg
            </Text>
            <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs">this month</Text>
          </View>
        )}
      </View>

      <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs mb-2 tracking-widest">
        LOG TODAY&apos;S WEIGHT
      </Text>
      <View className="flex-row gap-2 mb-5">
        <View className="flex-1 relative">
          <TextInput
            value={inputValue} onChangeText={setInputValue}
            placeholder={currentWeight !== null ? `${currentWeight.toFixed(1)}` : "Enter weight"}
            placeholderTextColor={c.placeholder} keyboardType="numeric"
            className="rounded-xl px-4 py-3 pr-10"
            style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "PlusJakartaSans_500Medium" }}
          />
          <Text className="absolute text-sm" style={{ right: 12, top: 12, color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }}>kg</Text>
        </View>
        <Pressable
          onPress={handleLog} disabled={!inputValue || parseFloat(inputValue) <= 0 || saving}
          className="rounded-xl px-5 py-3"
          style={{ backgroundColor: inputValue && parseFloat(inputValue) > 0 && !saving ? ACCENT.mint : c.buttonBg }}
        >
          <Text style={{
            fontFamily: "PlusJakartaSans_600SemiBold",
            color: inputValue && parseFloat(inputValue) > 0 && !saving ? "#0C0C0E" : c.textMuted,
          }}>
            {saving ? "..." : "Log"}
          </Text>
        </Pressable>
      </View>

      {recentEntries.length > 0 && (
        <>
          <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs mb-2 tracking-widest">
            RECENT ENTRIES
          </Text>
          {recentEntries.map((entry) => {
            const date = new Date(entry.logged_at);
            const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const isToday = new Date().toDateString() === date.toDateString();
            return (
              <View key={entry.id} className="flex-row items-center justify-between py-2" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
                <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-sm">
                  {isToday ? "Today" : dateStr}
                </Text>
                <View className="flex-row items-center gap-3">
                  <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">
                    {entry.weight_kg.toFixed(1)} kg
                  </Text>
                  <Pressable onPress={() => handleDelete(entry.id)}>
                    <Text style={{ color: c.textMuted }} className="text-xs">✕</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </>
      )}

      {entries.length === 0 && !loading && (
        <View className="items-center py-4">
          <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-sm">
            Log your first weight entry above
          </Text>
        </View>
      )}
    </View>
  );
}
