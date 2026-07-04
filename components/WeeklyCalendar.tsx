import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import type { FastingSession } from "@/lib/types";
import { GlassPanel } from "@/components/GlassPanel";

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
  const accent = getAccentColors(theme);
  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null);

  const weekDates = getWeekDates();
  const now = new Date();

  const dayData = weekDates.map((date) => {
    const daySessions = pastSessions.filter((s) => {
      if (!s.end_time || !s.start_time) return false;
      const start = new Date(s.start_time);
      const end = new Date(s.end_time);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const check = new Date(date);
      check.setHours(0, 0, 0, 0);
      return check >= start && check <= end;
    });

    const hasFast = daySessions.length > 0;
    const goalMet = daySessions.some((s) => {
      const hrs = (s.fasting_duration_minutes ?? 0) / 60;
      return hrs >= fastingHours;
    });
    const isToday = isSameDay(date, now);
    const bestSession = daySessions[0];

    return { date, hasFast, goalMet, isToday, session: bestSession, sessions: daySessions };
  });

  function getLineColor(goalMet: boolean): string {
    return goalMet ? accent.lime : accent.coral;
  }

  return (
    <View className="mb-4">
      <View className="flex-row" style={{ height: 56, alignItems: "flex-start" }}>
        {dayData.map((day, i) => {
          const sessionsCur = day.sessions;
          const sessionsNext = i < 6 ? dayData[i + 1].sessions : [];
          const sharedIds = new Set(sessionsCur.map((s) => s.id));
          const sharedCount = sessionsNext.filter((s) => sharedIds.has(s.id)).length;
          const showLine = sharedCount > 0;
          const isTransition = sessionsCur.length > 1 || sessionsNext.length > 1;

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
                  onPress={() => setTooltipIndex(tooltipIndex === i ? null : (day.hasFast ? i : null))}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: day.hasFast ? 0 : 1.5,
                      borderColor: day.isToday ? accent.lime : c.textFaint,
                      backgroundColor: day.hasFast
                        ? day.goalMet ? accent.lime : accent.coral
                        : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {day.hasFast && day.goalMet && (
                      <Text style={{ color: c.textOnAccent }} className="text-xs">✓</Text>
                    )}
                    {day.hasFast && !day.goalMet && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.6)" }} />
                    )}
                  </View>
                </Pressable>
              </View>
              {i < 6 && (
                <View style={{ flex: 1, height: 56, justifyContent: "center" }}>
                  {showLine ? (
                    isTransition ? (
                      <View className="flex-row items-center" style={{ height: 2 }}>
                        <View style={{ flex: 1, height: 2, backgroundColor: getLineColor(day.goalMet), borderTopLeftRadius: 1, borderBottomLeftRadius: 1 }} />
                        <View style={{ width: 4 }} />
                        <View style={{ flex: 1, height: 2, backgroundColor: getLineColor(dayData[i + 1].goalMet), borderTopRightRadius: 1, borderBottomRightRadius: 1 }} />
                      </View>
                    ) : (
                      <View style={{ height: 2, backgroundColor: getLineColor(day.goalMet), borderRadius: 1 }} />
                    )
                  ) : null}
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>

      {tooltipIndex !== null && dayData[tooltipIndex]?.session && (
        <GlassPanel className="mt-3  p-3">
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
                backgroundColor: dayData[tooltipIndex].goalMet ? accent.limeBg : accent.coralBg,
              }}
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
