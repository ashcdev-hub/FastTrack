import React, { useState } from "react";
import { Pressable, View, Text, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import { useFastCalendar } from "@/hooks/useFastCalendar";
import type { FastingSession } from "@/lib/types";
import { GlassPanel } from "@/components/GlassPanel";

type FastCalendarProps = {
  visible: boolean;
  userId: string | null;
  fastingHours: number;
  onClose: () => void;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const days: Date[] = [];

  for (let i = startDow - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }

  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function FastCalendar({ visible, userId, fastingHours, onClose }: FastCalendarProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { sessions } = useFastCalendar(userId, year, month);

  const days = getDaysInMonth(year, month);
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, i) => days.slice(i * 7, i * 7 + 7));

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else { setMonth(month - 1); }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else { setMonth(month + 1); }
    setSelectedDate(null);
  };

  const getSessionsForDay = (date: Date): FastingSession[] => {
    return sessions.filter((s) => {
      if (!s.end_time || !s.start_time) return false;
      const start = new Date(s.start_time);
      const end = new Date(s.end_time);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const check = new Date(date);
      check.setHours(0, 0, 0, 0);
      return check >= start && check <= end;
    });
  };

  const selectedDaySessions = selectedDate ? getSessionsForDay(selectedDate) : [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={onClose}>
        <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
          <View className="flex-row justify-between items-center mb-5">
            <Pressable onPress={prevMonth} className="p-2 rounded-xl" style={{ backgroundColor: c.buttonBg }}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={c.text} />
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-lg">
              {MONTH_NAMES[month]} {year}
            </Text>
            <Pressable onPress={nextMonth} className="p-2 rounded-xl" style={{ backgroundColor: c.buttonBg }}>
              <MaterialCommunityIcons name="chevron-right" size={24} color={c.text} />
            </Pressable>
          </View>

          <View className="flex-row mb-2">
            {DAY_LABELS.map((label) => (
              <View key={label} className="flex-1 items-center">
                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-[10px]">
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {weeks.map((week, rowIdx) => (
            <View key={rowIdx} className="flex-row" style={{ height: 44, alignItems: "flex-start" }}>
              {week.map((date, colIdx) => {
                const isCurrentMonth = date.getMonth() === month;
                const isToday = isSameDay(date, now);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const daySessions = getSessionsForDay(date);
                const hasFast = daySessions.length > 0;
                const goalMet = daySessions.some((s) => {
                  const hrs = (s.fasting_duration_minutes ?? 0) / 60;
                  return hrs >= fastingHours;
                });
                const nextDay = colIdx < 6 ? week[colIdx + 1] : null;
                const nextSessions = nextDay ? getSessionsForDay(nextDay) : [];
                const nextMonthOk = nextDay?.getMonth() === month;
                const sharedIds = new Set(daySessions.map((s) => s.id));
                const sharedCount = nextSessions.filter((s) => sharedIds.has(s.id)).length;
                const showLine = sharedCount > 0 && isCurrentMonth && nextMonthOk;
                const isTransition = daySessions.length > 1 || nextSessions.length > 1;

                return (
                  <React.Fragment key={rowIdx * 7 + colIdx}>
                    <View className="items-center" style={{ width: 32 }}>
                      <Pressable
                        onPress={() => setSelectedDate(isSelected ? null : date)}
                        className="py-1.5"
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            borderWidth: isSelected ? 2 : isToday ? 1.5 : 0,
                            borderColor: isSelected ? accent.lime : isToday ? accent.lime : "transparent",
                            backgroundColor: hasFast
                              ? goalMet ? accent.lime : accent.coral
                              : "transparent",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: isCurrentMonth ? 1 : 0.2,
                          }}
                        >
                          <Text
                            style={{
                              color: hasFast ? c.textOnAccent : c.text,
                              fontFamily: "Inter_400Regular",
                            }}
                            className="text-sm"
                          >
                            {date.getDate()}
                          </Text>
                        </View>
                      </Pressable>
                    </View>
                    {colIdx < 6 && (
                      <View style={{ flex: 1, height: 44, justifyContent: "center" }}>
                        {showLine ? (
                          isTransition ? (
                            <View className="flex-row items-center" style={{ height: 2 }}>
                              <View style={{ flex: 1, height: 2, backgroundColor: goalMet ? accent.lime : accent.coral, borderTopLeftRadius: 1, borderBottomLeftRadius: 1 }} />
                              <View style={{ width: 4 }} />
                              <View style={{ flex: 1, height: 2, backgroundColor: nextSessions.some((s) => (s.fasting_duration_minutes ?? 0) / 60 >= fastingHours) ? accent.lime : accent.coral, borderTopRightRadius: 1, borderBottomRightRadius: 1 }} />
                            </View>
                          ) : (
                            <View style={{ height: 2, backgroundColor: goalMet ? accent.lime : accent.coral, borderRadius: 1 }} />
                          )
                        ) : null}
                      </View>
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          ))}

          {selectedDate && (
            <GlassPanel className="mt-3  p-4">
              <Text style={{ color: c.textSecondary, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-xs mb-2">
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </Text>
              {selectedDaySessions.length === 0 ? (
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-sm">
                  No fasts recorded
                </Text>
              ) : (
                selectedDaySessions.map((s) => {
                  const hrs = Math.floor((s.fasting_duration_minutes ?? 0) / 60);
                  const mins = (s.fasting_duration_minutes ?? 0) % 60;
                  const met = (s.fasting_duration_minutes ?? 0) / 60 >= fastingHours;
                  return (
                    <View key={s.id} className="flex-row items-center justify-between py-1.5">
                      <View className="flex-row items-center gap-2">
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: met ? accent.lime : accent.coral,
                          }}
                        />
                        <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm">
                          {s.fasting_schedule ?? "Fast"} · {hrs}h {mins}m
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: met ? accent.lime : accent.coral,
                          fontFamily: "SpaceGrotesk_600SemiBold",
                        }}
                        className="text-xs"
                      >
                        {met ? "Goal met ✓" : "Missed"}
                      </Text>
                    </View>
                  );
                })
              )}
            </GlassPanel>
          )}

          <Pressable onPress={onClose} className="py-3 mt-4" style={{ backgroundColor: c.buttonBg }}>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-center">
              Close
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
