import React, { useState } from "react";
import { Pressable, View, Text, TextInput, Alert } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";
import type { WeightLogEntry } from "@/lib/types";

type WeightTrackerProps = {
  entries: WeightLogEntry[];
  currentWeight: number | null;
  weightChange: number | null;
  onAddWeight: (kg: number) => Promise<{ error: Error | null }>;
  onDeleteWeight: (id: string) => Promise<{ error: Error | null }>;
  loading: boolean;
};

export function WeightTracker({
  entries,
  currentWeight,
  weightChange,
  onAddWeight,
  onDeleteWeight,
  loading,
}: WeightTrackerProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  const handleLog = async () => {
    const weight = parseFloat(inputValue);
    if (isNaN(weight) || weight <= 0 || weight > 500) return;

    setSaving(true);
    await onAddWeight(weight);
    setInputValue("");
    setSaving(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Entry", "Remove this weight entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await onDeleteWeight(id);
        },
      },
    ]);
  };

  const recentEntries = entries.slice(0, 5);

  return (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text style={{ color: c.text }} className="text-3xl font-bold">
            {currentWeight !== null ? `${currentWeight.toFixed(1)}` : "—"}
          </Text>
          <Text style={{ color: c.textSecondary }} className="text-sm">
            kg
          </Text>
        </View>
        {weightChange !== null && weightChange !== 0 && (
          <View className="items-end">
            <Text
              style={{ color: weightChange < 0 ? "#10B981" : "#EF4444" }}
              className="text-lg font-semibold"
            >
              {weightChange < 0 ? "↓" : "↑"} {Math.abs(weightChange).toFixed(1)} kg
            </Text>
            <Text style={{ color: c.textMuted }} className="text-xs">
              this month
            </Text>
          </View>
        )}
      </View>

      <Text style={{ color: c.textSecondary }} className="text-xs font-bold mb-2 tracking-wider">
        LOG TODAY&apos;S WEIGHT
      </Text>
      <View className="flex-row gap-2 mb-5">
        <View className="flex-1 relative">
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={currentWeight !== null ? `${currentWeight.toFixed(1)}` : "Enter weight"}
            placeholderTextColor={c.placeholder}
            keyboardType="numeric"
            className="rounded-xl px-4 py-3 pr-10"
            style={{ backgroundColor: c.inputBg, color: c.text }}
          />
          <Text
            className="absolute text-sm"
            style={{ right: 12, top: 12, color: c.textMuted }}
          >
            kg
          </Text>
        </View>
        <Pressable
          onPress={handleLog}
          disabled={!inputValue || parseFloat(inputValue) <= 0 || saving}
          className="rounded-xl px-5 py-3"
          style={{
            backgroundColor:
              inputValue && parseFloat(inputValue) > 0 && !saving
                ? "#3B82F6"
                : c.buttonBg,
          }}
        >
          <Text
            className="font-semibold"
            style={{
              color:
                inputValue && parseFloat(inputValue) > 0 && !saving
                  ? "#FFFFFF"
                  : c.textMuted,
            }}
          >
            {saving ? "..." : "Log"}
          </Text>
        </Pressable>
      </View>

      {recentEntries.length > 0 && (
        <>
          <Text style={{ color: c.textSecondary }} className="text-xs font-bold mb-2 tracking-wider">
            RECENT ENTRIES
          </Text>
          {recentEntries.map((entry) => {
            const date = new Date(entry.logged_at);
            const dateStr = `${date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}`;
            const isToday =
              new Date().toDateString() === date.toDateString();

            return (
              <View
                key={entry.id}
                className="flex-row items-center justify-between py-2 border-b"
                style={{ borderColor: c.divider }}
              >
                <View className="flex-row items-center gap-2">
                  <Text style={{ color: c.textSecondary }} className="text-sm">
                    {isToday ? "Today" : dateStr}
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Text style={{ color: c.text }} className="text-sm font-medium">
                    {entry.weight_kg.toFixed(1)} kg
                  </Text>
                  <Pressable onPress={() => handleDelete(entry.id)}>
                    <Text style={{ color: c.textMuted }} className="text-xs">
                      ✕
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </>
      )}

      {entries.length === 0 && !loading && (
        <View className="items-center py-4">
          <Text style={{ color: c.textMuted }} className="text-sm">
            Log your first weight entry above
          </Text>
        </View>
      )}
    </View>
  );
}