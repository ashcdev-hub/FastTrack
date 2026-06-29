import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import type { FastCheckIn } from "@/lib/types";

const MOODS: Record<number, { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }> = {
  1: { label: "Terrible", icon: "emoticon-sad-outline", color: ACCENT.rose },
  2: { label: "Bad", icon: "emoticon-sad-outline", color: ACCENT.coral },
  3: { label: "Okay", icon: "emoticon-neutral-outline", color: ACCENT.amber },
  4: { label: "Good", icon: "emoticon-happy-outline", color: ACCENT.lime },
  5: { label: "Great", icon: "emoticon-excited-outline", color: ACCENT.cyan },
};

type CheckInTimelineProps = {
  checkIns: FastCheckIn[];
};

export function CheckInTimeline({ checkIns }: CheckInTimelineProps) {
  const { theme } = useThemeStore();
  const tc = getThemeColors(theme);
  const accent = getAccentColors(theme);
// accent defined below
// accent defined below
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
              <View style={{ marginTop: 2, marginBottom: 4 }}>
                <MaterialCommunityIcons
                  name={mood.icon}
                  size={18}
                  color={mood.color}
                />
              </View>
              {!isLast && (
                <View style={{ width: 1, flex: 1, backgroundColor: tc.divider, minHeight: 20 }} />
              )}
            </View>

            <View className="flex-1 pb-4">
              <View className="flex-row items-center mb-1">
                <Text style={{ color: tc.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs">
                  {format(time, "h:mm a")}  ·  <Text style={{ color: mood.color }}>{mood.label}</Text>
                </Text>
              </View>
              {checkIn.note && (
                <Text style={{ color: tc.textSecondary, fontFamily: "Inter_400Regular" }} className="text-sm">
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
