import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";

type FastingAchievementsProps = {
  streak: number;
  completedFasts: number;
  fastingHours: number;
  pushupStreak?: number;
  weeklyPushups?: number;
};

const FASTING_MILESTONES = [
  { count: 1, label: "First Fast" },
  { count: 7, label: "Week Warrior" },
  { count: 14, label: "Fortnight Champion" },
  { count: 30, label: "Monthly Master" },
  { count: 50, label: "Half Century" },
  { count: 100, label: "Century Club" },
];

const PUSHUP_MILESTONES = [
  { count: 100, label: "First 100" },
  { count: 500, label: "500 Club" },
  { count: 1000, label: "1K Warrior" },
  { count: 5000, label: "5K Champion" },
  { count: 10000, label: "10K Master" },
];

export function FastingAchievements({
  streak,
  completedFasts,
  fastingHours,
  pushupStreak = 0,
  weeklyPushups = 0,
}: FastingAchievementsProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);

  const nextFastingMilestone =
    FASTING_MILESTONES.find((m) => m.count > completedFasts) ??
    FASTING_MILESTONES[FASTING_MILESTONES.length - 1];
  const fastingProgress = Math.min(completedFasts / nextFastingMilestone.count, 1);

  const nextPushupMilestone =
    PUSHUP_MILESTONES.find((m) => m.count > weeklyPushups) ??
    PUSHUP_MILESTONES[PUSHUP_MILESTONES.length - 1];
  const pushupProgress = Math.min(weeklyPushups / nextPushupMilestone.count, 1);

  return (
    <View className="mb-6">
      <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-lg mb-4">
        Achievements
      </Text>

      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 glass-bg glass-border items-center py-4">
          <MaterialCommunityIcons name="fire" size={28} color={accent.lime} />
          <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold" }} className="text-2xl mt-1">
            {streak}
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs mt-1">
            Day Streak
          </Text>
        </View>

        <View className="flex-1 glass-bg glass-border items-center py-4">
          <MaterialCommunityIcons name="calendar-check" size={28} color={accent.cyan} />
          <Text style={{ color: accent.cyan, fontFamily: "Inter_700Bold" }} className="text-2xl mt-1">
            {completedFasts}
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs mt-1">
            Total Fasts
          </Text>
        </View>

        <View className="flex-1 glass-bg glass-border items-center py-4">
          <MaterialCommunityIcons name="arm-flex" size={28} color={accent.coral} />
          <Text style={{ color: accent.coral, fontFamily: "Inter_700Bold" }} className="text-2xl mt-1">
            {pushupStreak}
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs mt-1">
            Pushup Streak
          </Text>
        </View>
      </View>

      <View className="glass-bg glass-border p-4 mb-3">
        <View className="flex-row justify-between items-center mb-2">
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">
            Next Fast: {nextFastingMilestone.label}
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs">
            {completedFasts}/{nextFastingMilestone.count}
          </Text>
        </View>
        <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: c.cardBgAlt }}>
          <View
            className="h-full rounded-full"
            style={{ width: `${fastingProgress * 100}%`, backgroundColor: accent.lime }}
          />
        </View>
      </View>

      <View className="glass-bg glass-border p-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">
            Next Pushup: {nextPushupMilestone.label}
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs">
            {weeklyPushups}/{nextPushupMilestone.count}
          </Text>
        </View>
        <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: c.cardBgAlt }}>
          <View
            className="h-full rounded-full"
            style={{ width: `${pushupProgress * 100}%`, backgroundColor: accent.lime }}
          />
        </View>
      </View>
    </View>
  );
}
