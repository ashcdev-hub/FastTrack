import React, { useState } from "react";
import { Pressable, View, Text, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import { useWorkoutCalendar, type DailyWorkoutData } from "@/hooks/useWorkoutCalendar";
import type { WorkoutGoal } from "@/lib/types";
import { GlassPanel } from "@/components/GlassPanel";

type WorkoutCalendarProps = {
  visible: boolean;
  userId: string | null;
  goals: WorkoutGoal[];
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
  for (let i = startDow - 1; i >= 0; i--) days.push(new Date(year, month, -i));
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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

export function WorkoutCalendar({ visible, userId, goals, onClose }: WorkoutCalendarProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { dailyData } = useWorkoutCalendar(userId, year, month);

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
                const ds = toDateStr(date);
                const isCurrentMonth = date.getMonth() === month;
                const isToday = isSameDay(date, now);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const dayData = dailyData[ds];
                const workedOut = !!dayData;
                const goalMet = hasGoalMet(dayData, goals);
                const nextDay = colIdx < 6 ? week[colIdx + 1] : null;
                const nextDayData = nextDay ? dailyData[toDateStr(nextDay)] : undefined;
                const nextWorkedOut = !!nextDayData && nextDay?.getMonth() === month;
                const showLine = workedOut && nextWorkedOut;

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
                            backgroundColor: workedOut
                              ? goalMet ? accent.lime : accent.coral
                              : "transparent",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: isCurrentMonth ? 1 : 0.2,
                          }}
                        >
                          <Text
                            style={{
                              color: workedOut ? c.textOnAccent : c.text,
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
                        {showLine && (
                          <View style={{ height: 2, backgroundColor: goalMet ? accent.lime : accent.coral, borderRadius: 1 }} />
                        )}
                      </View>
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          ))}

          {selectedDate && (() => {
            const ds = toDateStr(selectedDate);
            const dayData = dailyData[ds];
            return (
              <GlassPanel className="mt-3  p-4">
                <Text style={{ color: c.textSecondary, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-xs mb-2">
                  {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </Text>
                {!dayData ? (
                  <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-sm">
                    No workouts recorded
                  </Text>
                ) : (
                  <>
                    <View className="flex-row justify-between mb-2">
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-sm">
                        {dayData.totalReps} reps
                      </Text>
                      <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-sm">
                        {Math.round(dayData.totalCalories)} cal
                      </Text>
                    </View>
                    {Object.entries(dayData.exercises).map(([exercise, reps]) => {
                      const goal = goals.find((g) => g.exercise_type === exercise);
                      const met = goal ? reps >= goal.daily_goal : false;
                      return (
                        <View key={exercise} className="flex-row items-center justify-between py-1">
                          <View className="flex-row items-center gap-2">
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: met ? accent.lime : accent.coral }} />
                            <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }} className="text-sm capitalize">
                              {exercise}
                            </Text>
                          </View>
                          <Text style={{ color: met ? accent.lime : c.textMuted, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-xs">
                            {reps} / {goal?.daily_goal ?? "-"}
                          </Text>
                        </View>
                      );
                    })}
                  </>
                )}
              </GlassPanel>
            );
          })()}

          <Pressable onPress={onClose} className="py-3 mt-4 items-center" style={{ backgroundColor: c.buttonBg }}>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
