import React, { useState } from "react";
import { Pressable, View, Text, Modal } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { useFastCalendar } from "@/hooks/useFastCalendar";
import type { FastingSession } from "@/lib/types";

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
  startDow = startDow === 0 ? 6 : startDow - 1; // Mon=0

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
      const d = new Date(s.end_time ?? s.start_time);
      return isSameDay(d, date);
    });
  };

  const selectedDaySessions = selectedDate ? getSessionsForDay(selectedDate) : [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: c.overlay }}>
        <View className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
          {/* Header */}
          <View className="flex-row justify-between items-center mb-5">
            <Pressable onPress={prevMonth} className="p-2 rounded-xl" style={{ backgroundColor: c.buttonBg }}>
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-lg">←</Text>
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-lg">
              {MONTH_NAMES[month]} {year}
            </Text>
            <Pressable onPress={nextMonth} className="p-2 rounded-xl" style={{ backgroundColor: c.buttonBg }}>
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-lg">→</Text>
            </Pressable>
          </View>

          {/* Day labels */}
          <View className="flex-row mb-2">
            {DAY_LABELS.map((label) => (
              <View key={label} className="flex-1 items-center">
                <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-[10px]">
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid — grouped into week rows */}
          {weeks.map((week, rowIdx) => (
            <View key={rowIdx} className="flex-row mb-1">
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

                return (
                  <Pressable
                    key={rowIdx * 7 + colIdx}
                    onPress={() => setSelectedDate(isSelected ? null : date)}
                    className="flex-1 items-center py-1.5"
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        borderWidth: isSelected ? 2 : isToday ? 1.5 : 0,
                        borderColor: isSelected ? ACCENT.mint : isToday ? ACCENT.mint : "transparent",
                        backgroundColor: hasFast
                          ? goalMet ? ACCENT.mint : ACCENT.coral
                          : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: isCurrentMonth ? 1 : 0.2,
                      }}
                    >
                      <Text
                        style={{
                          color: hasFast ? c.textOnAccent : c.text,
                          fontFamily: "PlusJakartaSans_500Medium",
                        }}
                        className="text-sm"
                      >
                        {date.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* Selected day detail */}
          {selectedDate && (
            <View
              className="mt-3 rounded-xl p-4"
              style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}
            >
              <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs mb-2">
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </Text>
              {selectedDaySessions.length === 0 ? (
                <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-sm">
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
                            backgroundColor: met ? ACCENT.mint : ACCENT.coral,
                          }}
                        />
                        <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">
                          {s.fasting_schedule ?? "Fast"} · {hrs}h {mins}m
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: met ? ACCENT.mint : ACCENT.coral,
                          fontFamily: "PlusJakartaSans_600SemiBold",
                        }}
                        className="text-xs"
                      >
                        {met ? "Goal met ✓" : "Missed"}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* Close */}
          <Pressable onPress={onClose} className="rounded-xl py-3 mt-4" style={{ backgroundColor: c.buttonBg }}>
            <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-center">
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
