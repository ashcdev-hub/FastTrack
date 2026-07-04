import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import type { WorkoutGoal } from "@/lib/types";
import type { DailyWorkoutData } from "@/hooks/useWorkoutCalendar";
import { GlassPanel } from "@/components/GlassPanel";

type WorkoutWeeklyCalendarProps = {
  dailyData: Map<string, DailyWorkoutData>;
  goals: WorkoutGoal[];
  onViewCalendar: () => void;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(): Date[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hasGoalMet(dayData: DailyWorkoutData | undefined, goals: WorkoutGoal[]): boolean {
  if (!dayData) return false;
  for (const goal of goals) {
    const reps = dayData.exercises[goal.exercise_type] ?? 0;
    if (reps >= goal.daily_goal) return true;
  }
  return false;
}

export function WorkoutWeeklyCalendar({ dailyData, goals, onViewCalendar }: WorkoutWeeklyCalendarProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null);

  const weekDates = getWeekDates();
  const now = new Date();

  const dayData = weekDates.map((date) => {
    const ds = toDateStr(date);
    const data = dailyData.get(ds);
    const isToday = isSameDay(date, now);
    const workedOut = !!data;
    const goalMet = hasGoalMet(data, goals);
    return { date, data, workedOut, goalMet, isToday };
  });

  return (
    <View className="mb-4">
      <View className="flex-row" style={{ height: 56, alignItems: "flex-start" }}>
        {dayData.map((day, i) => {
          const nextData = i < 6 ? dayData[i + 1] : null;
          const showLine = day.workedOut && (nextData?.workedOut ?? false);

          return (
            <React.Fragment key={i}>
              <View className="items-center" style={{ width: 36 }}>
                <Text
                  style={{
                    color: day.isToday ? c.text : c.textMuted,
                    fontFamily: day.isToday ? "Inter_700Bold" : "Inter_400Regular",
                  }}
                  className="text-[10px] mb-1.5"
                >
                  {DAY_LABELS[i]}
                </Text>
                <Pressable
                  onPress={() => setTooltipIndex(tooltipIndex === i ? null : (day.workedOut ? i : null))}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: day.workedOut ? 0 : 1.5,
                      borderColor: day.isToday ? accent.lime : c.textFaint,
                      backgroundColor: day.workedOut
                        ? day.goalMet ? accent.lime : accent.coral
                        : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {day.workedOut && day.goalMet && (
                      <Text style={{ color: c.textOnAccent }} className="text-xs">✓</Text>
                    )}
                    {day.workedOut && !day.goalMet && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.6)" }} />
                    )}
                  </View>
                </Pressable>
              </View>
              {i < 6 && (
                <View style={{ flex: 1, height: 56, justifyContent: "center" }}>
                  {showLine && (
                    <View style={{ height: 2, backgroundColor: day.goalMet ? accent.lime : accent.coral, borderRadius: 1 }} />
                  )}
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>

      {tooltipIndex !== null && dayData[tooltipIndex]?.data && (
        <GlassPanel className="mt-3  p-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-sm">
                {dayData[tooltipIndex].data!.totalReps} reps
              </Text>
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mt-0.5">
                {dayData[tooltipIndex].data!.totalSets} sets · {Math.round(dayData[tooltipIndex].data!.totalCalories)} cal
              </Text>
            </View>
            <View
              className="px-2 py-1 rounded-lg"
              style={{ backgroundColor: dayData[tooltipIndex].goalMet ? accent.limeBg : accent.coralBg }}
            >
              <Text
                style={{
                  color: dayData[tooltipIndex].goalMet ? accent.lime : accent.coral,
                  fontFamily: "SpaceGrotesk_600SemiBold",
                }}
                className="text-xs"
              >
                {dayData[tooltipIndex].goalMet ? "Goal met ✓" : "Goal missed"}
              </Text>
            </View>
          </View>
        </GlassPanel>
      )}

      <Pressable onPress={onViewCalendar} className="mt-3 items-center">
        <Text style={{ color: accent.lime, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-sm">
          View Calendar →
        </Text>
      </Pressable>
    </View>
  );
}
