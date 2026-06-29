import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
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
  const accent = getAccentColors(theme);

  return (
    <View className="mb-6">
      <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-lg mb-4">
        This Week
      </Text>

      <View className="flex-row gap-3 mb-3">
        <View className="flex-1 glass-panel items-center py-4">
          <MaterialCommunityIcons name="timer-outline" size={24} color={accent.lime} />
          <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold" }} className="text-xl mt-1">
            {formatDuration(fasting.avgDurationMin)}
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs mt-1 text-center">
            Avg Fast
          </Text>
        </View>

        <View className="flex-1 glass-panel items-center py-4">
          <MaterialCommunityIcons name="trending-up" size={24} color={accent.coral} />
          <Text style={{ color: accent.coral, fontFamily: "Inter_700Bold" }} className="text-xl mt-1">
            {formatDuration(fasting.longestFastMin)}
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs mt-1 text-center">
            Longest
          </Text>
        </View>

        <View className="flex-1 glass-panel items-center py-4">
          <MaterialCommunityIcons name="target" size={24} color={accent.cyan} />
          <Text style={{ color: accent.cyan, fontFamily: "Inter_700Bold" }} className="text-xl mt-1">
            {fasting.totalFastingHours}h
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs mt-1 text-center">
            Total
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3 mb-3">
        <View className="flex-1 glass-panel items-center py-4">
          <MaterialCommunityIcons name="water" size={24} color={accent.cyan} />
          <Text style={{ color: accent.cyan, fontFamily: "Inter_700Bold" }} className="text-xl mt-1">
            {displayWater(water.dailyAverageMl, unitPrefs)}
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs mt-1 text-center">
            Daily Avg
          </Text>
        </View>

        <View className="flex-1 glass-panel items-center py-4">
          <MaterialCommunityIcons name="target" size={24} color={accent.lime} />
          <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold" }} className="text-xl mt-1">
            {water.goalHitRate}%
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs mt-1 text-center">
            Goal Hit Rate
          </Text>
        </View>
      </View>

      {workouts && (
        <View className="flex-row gap-3">
          <View className="flex-1 glass-panel items-center py-4">
            <MaterialCommunityIcons name="dumbbell" size={24} color={accent.lime} />
            <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold" }} className="text-xl mt-1">
              {workouts.totalReps}
            </Text>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs mt-1 text-center">
              Total Reps
            </Text>
          </View>

          <View className="flex-1 glass-panel items-center py-4">
            <MaterialCommunityIcons name="fire" size={24} color={accent.coral} />
            <Text style={{ color: accent.coral, fontFamily: "Inter_700Bold" }} className="text-xl mt-1">
              {Math.round(workouts.totalCalories)}
            </Text>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs mt-1 text-center">
              Calories
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
