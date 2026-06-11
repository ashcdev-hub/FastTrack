import React from "react";
import { View, Text } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Timer01Icon from "@hugeicons/core-free-icons/dist/esm/Timer01Icon";
import Award01Icon from "@hugeicons/core-free-icons/dist/esm/Award01Icon";
import DropletIcon from "@hugeicons/core-free-icons/dist/esm/DropletIcon";
import Target01Icon from "@hugeicons/core-free-icons/dist/esm/Target01Icon";
import Dumbbell01Icon from "@hugeicons/core-free-icons/dist/esm/Dumbbell01Icon";
import FireIcon from "@hugeicons/core-free-icons/dist/esm/FireIcon";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { displayWater, DEFAULT_UNITS } from "@/lib/units";
import type { WeeklyFastingStats } from "@/hooks/useWeeklyFastingStats";
import type { WeeklyWaterStats } from "@/hooks/useWeeklyWaterStats";
import type { WeeklyStats as WorkoutWeeklyStats } from "@/hooks/useWorkoutLog";
import type { UnitPreferences } from "@/lib/units";

type WeeklyStatsProps = {
  fasting: WeeklyFastingStats;
  water: WeeklyWaterStats;
  workouts?: WorkoutWeeklyStats;
  unitPrefs?: UnitPreferences;
};

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function WeeklyStats({ fasting, water, workouts, unitPrefs = DEFAULT_UNITS }: WeeklyStatsProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  return (
    <View className="mb-6">
      <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-lg mb-4">
        This Week
      </Text>

      {/* Fasting Stats */}
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1 rounded-xl p-4 items-center" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
          <HugeiconsIcon icon={Timer01Icon} size={24} color={ACCENT.mint} strokeWidth={1.5} />
          <Text style={{ color: ACCENT.mint, fontFamily: "PlusJakartaSans_700Bold" }} className="text-xl mt-1">
            {formatDuration(fasting.avgDurationMin)}
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mt-1 text-center">
            Avg Fast
          </Text>
        </View>

        <View className="flex-1 rounded-xl p-4 items-center" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
          <HugeiconsIcon icon={Award01Icon} size={24} color={ACCENT.coral} strokeWidth={1.5} />
          <Text style={{ color: ACCENT.coral, fontFamily: "PlusJakartaSans_700Bold" }} className="text-xl mt-1">
            {formatDuration(fasting.longestFastMin)}
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mt-1 text-center">
            Longest
          </Text>
        </View>

        <View className="flex-1 rounded-xl p-4 items-center" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
          <HugeiconsIcon icon={Target01Icon} size={24} color={ACCENT.sky} strokeWidth={1.5} />
          <Text style={{ color: ACCENT.sky, fontFamily: "PlusJakartaSans_700Bold" }} className="text-xl mt-1">
            {fasting.totalFastingHours}h
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mt-1 text-center">
            Total
          </Text>
        </View>
      </View>

      {/* Water Stats */}
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1 rounded-xl p-4 items-center" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
          <HugeiconsIcon icon={DropletIcon} size={24} color={ACCENT.sky} strokeWidth={1.5} />
          <Text style={{ color: ACCENT.sky, fontFamily: "PlusJakartaSans_700Bold" }} className="text-xl mt-1">
            {displayWater(water.dailyAverageMl, unitPrefs)}
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mt-1 text-center">
            Daily Avg
          </Text>
        </View>

        <View className="flex-1 rounded-xl p-4 items-center" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
          <HugeiconsIcon icon={Target01Icon} size={24} color={ACCENT.mint} strokeWidth={1.5} />
          <Text style={{ color: ACCENT.mint, fontFamily: "PlusJakartaSans_700Bold" }} className="text-xl mt-1">
            {water.goalHitRate}%
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mt-1 text-center">
            Goal Hit Rate
          </Text>
        </View>
      </View>

      {/* Workout Stats */}
      {workouts && (
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-xl p-4 items-center" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
            <HugeiconsIcon icon={Dumbbell01Icon} size={24} color={ACCENT.mint} strokeWidth={1.5} />
            <Text style={{ color: ACCENT.mint, fontFamily: "PlusJakartaSans_700Bold" }} className="text-xl mt-1">
              {workouts.totalReps}
            </Text>
            <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mt-1 text-center">
              Total Reps
            </Text>
          </View>

          <View className="flex-1 rounded-xl p-4 items-center" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
            <HugeiconsIcon icon={FireIcon} size={24} color={ACCENT.coral} strokeWidth={1.5} />
            <Text style={{ color: ACCENT.coral, fontFamily: "PlusJakartaSans_700Bold" }} className="text-xl mt-1">
              {Math.round(workouts.totalCalories)}
            </Text>
            <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mt-1 text-center">
              Calories
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
