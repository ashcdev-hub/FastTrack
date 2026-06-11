import React from "react";
import { View, Text } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Sad01Icon from "@hugeicons/core-free-icons/dist/esm/Sad01Icon";
import FrownIcon from "@hugeicons/core-free-icons/dist/esm/FrownIcon";
import MehIcon from "@hugeicons/core-free-icons/dist/esm/MehIcon";
import SmileIcon from "@hugeicons/core-free-icons/dist/esm/SmileIcon";
import Happy01Icon from "@hugeicons/core-free-icons/dist/esm/Happy01Icon";
import { format } from "date-fns";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import type { FastCheckIn } from "@/lib/types";

const MOODS: Record<number, { label: string; icon: any; color: string }> = {
  1: { label: "Terrible", icon: Sad01Icon, color: ACCENT.rose },
  2: { label: "Bad", icon: FrownIcon, color: ACCENT.coral },
  3: { label: "Okay", icon: MehIcon, color: ACCENT.amber },
  4: { label: "Good", icon: SmileIcon, color: ACCENT.mint },
  5: { label: "Great", icon: Happy01Icon, color: ACCENT.mintLight },
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
              <View style={{ marginTop: 2, marginBottom: 4 }}>
                <HugeiconsIcon
                  icon={mood.icon}
                  size={18}
                  color={mood.color}
                  strokeWidth={1.5}
                />
              </View>
              {!isLast && (
                <View style={{ width: 1, flex: 1, backgroundColor: tc.divider, minHeight: 20 }} />
              )}
            </View>

            <View className="flex-1 pb-4">
              <View className="flex-row items-center mb-1">
                <Text style={{ color: tc.textSecondary, fontFamily: "PlusJakartaSans_500Medium" }} className="text-xs">
                  {format(time, "h:mm a")}  ·  <Text style={{ color: mood.color }}>{mood.label}</Text>
                </Text>
              </View>
              {checkIn.note && (
                <Text style={{ color: tc.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-sm">
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
