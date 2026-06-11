import React from "react";
import { View, Text } from "react-native";
import { format } from "date-fns";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";
import type { FastCheckIn } from "@/lib/types";

const MOODS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😫", label: "Terrible" },
  2: { emoji: "😔", label: "Bad" },
  3: { emoji: "😐", label: "Okay" },
  4: { emoji: "😊", label: "Good" },
  5: { emoji: "🤩", label: "Great" },
};

type CheckInTimelineProps = {
  checkIns: FastCheckIn[];
};

export function CheckInTimeline({ checkIns }: CheckInTimelineProps) {
  const { theme } = useThemeStore();
  const tc = getThemeColors(theme);
  if (checkIns.length === 0) return null;

  return (
    <View className="mb-4">
      {checkIns.map((checkIn, i) => {
        const mood = MOODS[checkIn.mood] ?? MOODS[3];
        const time = new Date(checkIn.created_at);
        const isLast = i === checkIns.length - 1;

        return (
          <View key={checkIn.id} className="flex-row" style={{ marginBottom: isLast ? 0 : 2 }}>
            <View className="items-center mr-3" style={{ width: 24 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: checkIn.phase === "fasting" ? "#10B981" : "#F59E0B",
                  marginTop: 4,
                }}
              />
              {!isLast && (
                <View style={{ width: 1, flex: 1, backgroundColor: tc.divider, minHeight: 20 }} />
              )}
            </View>

            <View className="flex-1 pb-4">
              <View className="flex-row items-center mb-1">
                <Text className="text-lg mr-1">{mood.emoji}</Text>
                <Text style={{ color: tc.textMuted }} className="text-xs">
                  {format(time, "h:mm a")} · {mood.label}
                </Text>
              </View>
              {checkIn.note && (
                <Text style={{ color: tc.textSecondary }} className="text-sm">
                  {checkIn.note}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
