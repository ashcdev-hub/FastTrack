import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import type { FastingSession } from "@/lib/types";

type WeeklyCalendarProps = {
  pastSessions: FastingSession[];
  fastingHours: number;
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

export function WeeklyCalendar({ pastSessions, fastingHours, onViewCalendar }: WeeklyCalendarProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null);

  const weekDates = getWeekDates();
  const now = new Date();

  const dayData = weekDates.map((date) => {
    const daySessions = pastSessions.filter((s) => {
      const sessionDate = new Date(s.end_time ?? s.start_time);
      return isSameDay(sessionDate, date);
    });

    const hasFast = daySessions.length > 0;
    const goalMet = daySessions.some((s) => {
      const hrs = (s.fasting_duration_minutes ?? 0) / 60;
      return hrs >= fastingHours;
    });
    const isToday = isSameDay(date, now);
    const bestSession = daySessions[0];

    return { date, hasFast, goalMet, isToday, session: bestSession };
  });

  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-start px-1">
        {dayData.map((day, i) => (
          <Pressable
            key={i}
            onPress={() => setTooltipIndex(tooltipIndex === i ? null : (day.hasFast ? i : null))}
            className="items-center"
            style={{ minWidth: 40 }}
          >
            <Text
              style={{
                color: day.isToday ? c.text : c.textMuted,
                fontFamily: day.isToday ? "Inter_700Bold" : "Inter_400Regular",
              }}
              className="text-[10px] mb-1.5"
            >
              {DAY_LABELS[i]}
            </Text>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: day.hasFast ? 0 : 1.5,
                borderColor: day.isToday ? ACCENT.lime : c.textFaint,
                backgroundColor: day.hasFast
                  ? day.goalMet ? ACCENT.lime : ACCENT.coral
                  : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {day.hasFast && day.goalMet && (
                <Text style={{ color: "#161e00" }} className="text-xs">✓</Text>
              )}
              {day.hasFast && !day.goalMet && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.6)" }} />
              )}
            </View>
          </Pressable>
        ))}
      </View>

      {tooltipIndex !== null && dayData[tooltipIndex]?.session && (
        <View className="mt-3 glass-panel p-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-sm">
                {dayData[tooltipIndex].session?.fasting_schedule ?? "Fast"}
              </Text>
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mt-0.5">
                {(() => {
                  const s = dayData[tooltipIndex].session!;
                  const hrs = Math.floor((s.fasting_duration_minutes ?? 0) / 60);
                  const mins = (s.fasting_duration_minutes ?? 0) % 60;
                  return `${hrs}h ${mins}m`;
                })()}
              </Text>
            </View>
            <View
              className="px-2 py-1 rounded-lg"
              style={{
                backgroundColor: dayData[tooltipIndex].goalMet ? ACCENT.limeBg : ACCENT.coralBg,
              }}
            >
              <Text
                style={{
                  color: dayData[tooltipIndex].goalMet ? ACCENT.lime : ACCENT.coral,
                  fontFamily: "SpaceGrotesk_600SemiBold",
                }}
                className="text-xs"
              >
                {dayData[tooltipIndex].goalMet ? "Goal met ✓" : "Goal missed"}
              </Text>
            </View>
          </View>
        </View>
      )}

      <Pressable onPress={onViewCalendar} className="mt-3 items-center">
        <Text style={{ color: ACCENT.lime, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-sm">
          View Calendar →
        </Text>
      </Pressable>
    </View>
  );
}
