import React from "react";
import { View, Text } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import FireIcon from "@hugeicons/core-free-icons/dist/esm/FireIcon";
import ChampionIcon from "@hugeicons/core-free-icons/dist/esm/ChampionIcon";
import Target01Icon from "@hugeicons/core-free-icons/dist/esm/Target01Icon";
import Dumbbell01Icon from "@hugeicons/core-free-icons/dist/esm/Dumbbell01Icon";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";

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
      <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-lg mb-4">
        Achievements
      </Text>

      {/* Stats row */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 rounded-xl p-4 items-center" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
          <HugeiconsIcon icon={FireIcon} size={28} color={ACCENT.mint} strokeWidth={1.5} />
          <Text style={{ color: ACCENT.mint, fontFamily: "PlusJakartaSans_700Bold" }} className="text-2xl mt-1">
            {streak}
          </Text>
          <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mt-1">
            Day Streak
          </Text>
        </View>

        <View className="flex-1 rounded-xl p-4 items-center" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
          <HugeiconsIcon icon={ChampionIcon} size={28} color={ACCENT.sky} strokeWidth={1.5} />
          <Text style={{ color: ACCENT.sky, fontFamily: "PlusJakartaSans_700Bold" }} className="text-2xl mt-1">
            {completedFasts}
          </Text>
          <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mt-1">
            Total Fasts
          </Text>
        </View>

        <View className="flex-1 rounded-xl p-4 items-center" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
          <HugeiconsIcon icon={Dumbbell01Icon} size={28} color={ACCENT.coral} strokeWidth={1.5} />
          <Text style={{ color: ACCENT.coral, fontFamily: "PlusJakartaSans_700Bold" }} className="text-2xl mt-1">
            {pushupStreak}
          </Text>
          <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mt-1">
            Pushup Streak
          </Text>
        </View>
      </View>

      {/* Fasting milestone */}
      <View className="rounded-xl p-4 mb-3" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
        <View className="flex-row justify-between items-center mb-2">
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">
            Next Fast: {nextFastingMilestone.label}
          </Text>
          <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs">
            {completedFasts}/{nextFastingMilestone.count}
          </Text>
        </View>
        <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: c.cardBgAlt }}>
          <View
            className="h-full rounded-full"
            style={{ width: `${fastingProgress * 100}%`, backgroundColor: ACCENT.mint }}
          />
        </View>
      </View>

      {/* Pushup milestone */}
      <View className="rounded-xl p-4" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
        <View className="flex-row justify-between items-center mb-2">
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">
            Next Pushup: {nextPushupMilestone.label}
          </Text>
          <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs">
            {weeklyPushups}/{nextPushupMilestone.count}
          </Text>
        </View>
        <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: c.cardBgAlt }}>
          <View
            className="h-full rounded-full"
            style={{ width: `${pushupProgress * 100}%`, backgroundColor: ACCENT.mint }}
          />
        </View>
      </View>
    </View>
  );
}
