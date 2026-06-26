import React, { useState, useMemo } from "react";
import { Pressable, View, Text, ScrollView, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import type { FoodLogEntry } from "@/lib/types";

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

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

type MealCalendarModalProps = {
  visible: boolean;
  entries: FoodLogEntry[];
  onClose: () => void;
};

export function MealCalendarModal({ visible, entries, onClose }: MealCalendarModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < days.length; i += 7) w.push(days.slice(i, i + 7));
    return w;
  }, [days]);

  const mealsByDate = useMemo(() => {
    const map = new Map<string, FoodLogEntry[]>();
    entries.forEach((e) => {
      const key = new Date(e.logged_at).toISOString().split("T")[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [entries]);

  const selectedDayMeals = selectedDate ? mealsByDate.get(selectedDate.toISOString().split("T")[0]) ?? [] : [];

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); setSelectedDate(null); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); setSelectedDate(null); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={onClose}>
        <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated, maxHeight: "85%" }}>
          <View className="flex-row justify-between items-center mb-5">
            <Pressable onPress={prevMonth} className="p-2 rounded-xl" style={{ backgroundColor: c.buttonBg }}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={c.text} />
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18 }}>
              {MONTH_NAMES[month]} {year}
            </Text>
            <Pressable onPress={nextMonth} className="p-2 rounded-xl" style={{ backgroundColor: c.buttonBg }}>
              <MaterialCommunityIcons name="chevron-right" size={24} color={c.text} />
            </Pressable>
          </View>

          <View className="flex-row mb-2">
            {DAY_LABELS.map((l) => (
              <View key={l} className="flex-1 items-center">
                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 10 }}>{l}</Text>
              </View>
            ))}
          </View>

          {weeks.map((week, ri) => (
            <View key={ri} className="flex-row mb-1">
              {week.map((date, ci) => {
                const isCurrentMonth = date.getMonth() === month;
                const isToday = isSameDay(date, now);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const dayKey = date.toISOString().split("T")[0];
                const dayMeals = mealsByDate.get(dayKey);
                const hasMeals = !!dayMeals && dayMeals.length > 0;
                const totalCal = hasMeals ? dayMeals!.reduce((s, e) => s + (e.calories ?? 0), 0) : 0;

                return (
                  <Pressable
                    key={ri * 7 + ci}
                    onPress={() => setSelectedDate(isSelected ? null : date)}
                    className="flex-1 items-center py-1.5"
                  >
                    <View style={{
                      width: 36, height: 36, borderRadius: 18,
                      borderWidth: isSelected ? 2 : isToday ? 1.5 : 0,
                      borderColor: isSelected ? ACCENT.lime : isToday ? ACCENT.lime : "transparent",
                      backgroundColor: hasMeals ? ACCENT.cyanBg : "transparent",
                      alignItems: "center", justifyContent: "center",
                      opacity: isCurrentMonth ? 1 : 0.2,
                    }}>
                      <Text style={{ color: hasMeals ? ACCENT.cyan : c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}>
                        {date.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}

          {selectedDate && (
            <View className="mt-3 glass-panel p-4" style={{ maxHeight: 200 }}>
              <ScrollView showsVerticalScrollIndicator={true}>
                <Text style={{ color: c.textSecondary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 12, marginBottom: 8 }}>
                  {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  {selectedDayMeals.length > 0 ? ` — ${selectedDayMeals.reduce((s, e) => s + (e.calories ?? 0), 0)} kcal` : ""}
                </Text>
                {selectedDayMeals.length === 0 ? (
                  <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 13 }}>No meals recorded</Text>
                ) : (
                  selectedDayMeals.slice(0, 10).map((entry) => (
                    <View key={entry.id} className="flex-row items-center justify-between py-1.5">
                      <View className="flex-row items-center gap-2 flex-1">
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT.cyan }} />
                        <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 13 }} numberOfLines={1}>
                          {entry.name}
                        </Text>
                      </View>
                      <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginLeft: 8 }}>
                        {entry.calories ?? 0} kcal
                      </Text>
                    </View>
                  ))
                )}
                {selectedDayMeals.length > 10 && (
                  <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center", marginTop: 4 }}>
                    +{selectedDayMeals.length - 10} more items
                  </Text>
                )}
              </ScrollView>
            </View>
          )}

          <Pressable onPress={onClose} className="rounded-xl py-3 mt-4 items-center" style={{ backgroundColor: c.buttonBg }}>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
