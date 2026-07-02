import React, { useState, useMemo } from "react";
import { Pressable, View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, getAccentColors } from "@/lib/theme-colors";
import type { PeriodLogEntry, CyclePhase, PeriodSettings } from "@/lib/types";
import { getPhaseColor, getPhaseColorBg, getCycleDayColor } from "@/lib/cycle-phases";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;
  const days: Date[] = [];
  for (let i = startDow - 1; i >= 0; i--) days.push(new Date(year, month, -i));
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }
  return days;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

type PeriodCalendarProps = {
  entriesByDate: Map<string, PeriodLogEntry>;
  predictedPeriods: string[];
  settings: PeriodSettings;
  cycleDay: number;
  cycleLength: number;
  onDayPress: (dateStr: string) => void;
};

export function PeriodCalendar({ entriesByDate, predictedPeriods, settings, cycleDay, cycleLength, onDayPress }: PeriodCalendarProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const weeks = useMemo(() => {
    const w: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) w.push(days.slice(i, i + 7));
    return w;
  }, [days]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); };

  const predictedSet = new Set(predictedPeriods);

  return (
    <View className="glass-panel rounded-xl p-5">
      <View className="flex-row justify-between items-center mb-4">
        <Pressable onPress={prevMonth} hitSlop={8} className="p-2 rounded-lg" style={{ backgroundColor: c.buttonBg }}>
          <MaterialCommunityIcons name="chevron-left" size={18} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 16 }}>
          {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month]} {year}
        </Text>
        <Pressable onPress={nextMonth} hitSlop={8} className="p-2 rounded-lg" style={{ backgroundColor: c.buttonBg }}>
          <MaterialCommunityIcons name="chevron-right" size={18} color={c.text} />
        </Pressable>
      </View>

      <View className="flex-row mb-2">
        {DAY_LABELS.map((d) => (
          <View key={d} className="flex-1 items-center">
            <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 9, letterSpacing: 0.5 }}>
              {d[0]}
            </Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} className="flex-row mb-1">
          {week.map((date, di) => {
            const ds = toDateStr(date);
            const entry = entriesByDate.get(ds);
            const isToday = isSameDay(date, now);
            const isCurrentMonth = date.getMonth() === month;
            const isPredicted = predictedSet.has(ds);
            const daysSinceToday = Math.round((date.getTime() - now.getTime()) / 86400000);
            const relativeCycleDay = ((cycleDay + daysSinceToday - 1 + cycleLength * 10) % cycleLength) + 1;
            const phase: CyclePhase = entry?.flow_intensity
              ? "menstrual"
              : relativeCycleDay >= 1
                ? getCycleDayColor(relativeCycleDay, settings)
                : "follicular";
            const phaseColor = getPhaseColor(phase, theme);

            const dotColor = entry?.cramps && entry.cramps !== "none"
              ? accent.rose
              : entry?.headache
                ? accent.coral
                : entry?.bloating
                  ? accent.amber
                  : null;

            return (
              <Pressable
                key={di}
                onPress={() => isCurrentMonth && onDayPress(ds)}
                className="flex-1 items-center py-1"
                style={{ opacity: isCurrentMonth ? 1 : 0.2 }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    backgroundColor: entry?.flow_intensity
                      ? getPhaseColorBg("menstrual", theme)
                      : isPredicted && isCurrentMonth
                        ? "transparent"
                        : "transparent",
                    borderWidth: isToday ? 1.5 : isPredicted && !entry?.flow_intensity ? 1.5 : 0,
                    borderColor: isToday
                      ? accent.lime
                      : isPredicted && !entry?.flow_intensity
                        ? phaseColor + "55"
                        : "transparent",
                    borderStyle: isPredicted && !entry?.flow_intensity ? "dashed" : "solid",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: entry?.flow_intensity
                        ? getPhaseColor("menstrual", theme)
                        : isToday
                          ? accent.lime
                          : c.text,
                      fontFamily: isToday ? "SpaceGrotesk_700Bold" : "Inter_400Regular",
                      fontSize: 13,
                    }}
                  >
                    {date.getDate()}
                  </Text>
                  {dotColor && (
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: dotColor, position: "absolute", bottom: 2 }} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
