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
  onDeleteEntry?: (id: string) => Promise<void>;
  onUpdateEntry?: (id: string, updates: Partial<Pick<FoodLogEntry, "calories" | "protein_g" | "carbs_g" | "fat_g">>) => Promise<void>;
  onSaveAsMeal?: (items: FoodLogEntry[]) => void;
};

export function MealCalendarModal({ visible, entries, onClose, onDeleteEntry, onUpdateEntry, onSaveAsMeal }: MealCalendarModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEntry, setEditingEntry] = useState<FoodLogEntry | null>(null);
  const [eCals, setECals] = useState(0);
  const [eProtein, setEProtein] = useState(0);
  const [eCarbs, setECarbs] = useState(0);
  const [eFat, setEFat] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const handleEdit = (entry: FoodLogEntry) => {
    setEditingEntry(entry);
    setECals(entry.calories ?? 0);
    setEProtein(entry.protein_g ?? 0);
    setECarbs(entry.carbs_g ?? 0);
    setEFat(entry.fat_g ?? 0);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry || !onUpdateEntry) return;
    setSaving(true);
    await onUpdateEntry(editingEntry.id, { calories: eCals, protein_g: eProtein, carbs_g: eCarbs, fat_g: eFat });
    setSaving(false);
    setEditingEntry(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId || !onDeleteEntry) return;
    await onDeleteEntry(deleteConfirmId);
    setDeleteConfirmId(null);
  };

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
                    <View key={entry.id} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
                      <Pressable
                        onPress={() => handleEdit(entry)}
                        className="flex-row items-center gap-2 flex-1"
                      >
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT.cyan }} />
                        <View className="flex-1">
                          <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 13 }} numberOfLines={1}>
                            {entry.name}
                          </Text>
                          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 11 }}>
                            {entry.calories ?? 0} kcal · P{entry.protein_g ?? 0}g · C{entry.carbs_g ?? 0}g · F{entry.fat_g ?? 0}g
                          </Text>
                        </View>
                      </Pressable>
                      {onDeleteEntry && (
                        <Pressable onPress={() => setDeleteConfirmId(entry.id)} className="p-2">
                          <MaterialCommunityIcons name="delete-outline" size={18} color={c.textMuted} />
                        </Pressable>
                      )}
                    </View>
                  ))
                )}
                {selectedDayMeals.length > 10 && (
                  <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center", marginTop: 4 }}>
                    +{selectedDayMeals.length - 10} more items
                  </Text>
                )}
                {onSaveAsMeal && selectedDayMeals.length > 0 && (
                  <Pressable onPress={() => onSaveAsMeal(selectedDayMeals)} className="flex-row items-center justify-center gap-1.5 py-2 mt-1 rounded-lg" style={{ backgroundColor: c.buttonBg }}>
                    <MaterialCommunityIcons name="bookmark-outline" size={14} color={ACCENT.cyan} />
                    <Text style={{ color: ACCENT.cyan, fontFamily: "Inter_700Bold", fontSize: 12 }}>Save as Meal</Text>
                  </Pressable>
                )}
              </ScrollView>
            </View>
          )}

          <Pressable onPress={onClose} className="rounded-xl py-3 mt-4 items-center" style={{ backgroundColor: c.buttonBg }}>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>

      {/* Edit Modal */}
      <Modal visible={!!editingEntry} transparent animationType="slide" onRequestClose={() => setEditingEntry(null)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setEditingEntry(null)}>
          <Pressable className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }} onStartShouldSetResponder={() => true}>
            <View className="flex-row justify-between items-center mb-4">
              <Pressable onPress={() => setEditingEntry(null)}>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15 }}>Cancel</Text>
              </Pressable>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20 }}>Edit Meal</Text>
              <View className="w-14" />
            </View>

            {editingEntry && (
              <>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center", marginBottom: 20 }}>
                  {editingEntry.name}
                </Text>

                <View className="rounded-xl p-4 mb-5" style={{ backgroundColor: c.cardBg }}>
                  {[
                    { label: "CALORIES", val: eCals, set: setECals, step: 50, presets: [100, 200, 300, 500] },
                    { label: "PROTEIN (g)", val: eProtein, set: setEProtein, step: 5, presets: [10, 20, 30, 50] },
                    { label: "CARBS (g)", val: eCarbs, set: setECarbs, step: 5, presets: [10, 20, 30, 50] },
                    { label: "FAT (g)", val: eFat, set: setEFat, step: 5, presets: [5, 10, 15, 20] },
                  ].map((macro) => (
                    <View key={macro.label} className="mb-4 last:mb-0">
                      <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 3 }}>{macro.label}</Text>
                      <View className="flex-row items-center gap-2 rounded-xl px-3" style={{ backgroundColor: c.inputBg }}>
                        <Pressable onPress={() => macro.set(Math.max(0, macro.val - macro.step))} className="p-2">
                          <MaterialCommunityIcons name="minus" size={18} color={c.text} />
                        </Pressable>
                        <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 17, flex: 1, textAlign: "center" }}>{macro.val}</Text>
                        <Pressable onPress={() => macro.set(macro.val + macro.step)} className="p-2">
                          <MaterialCommunityIcons name="plus" size={18} color={c.text} />
                        </Pressable>
                      </View>
                      <View className="flex-row gap-1 mt-1">
                        {macro.presets.map((v) => (
                          <Pressable key={v} onPress={() => macro.set(v)}
                            className="flex-1 py-1.5 rounded-md items-center"
                            style={{ backgroundColor: macro.val === v ? ACCENT.limeBg : c.buttonBg }}>
                            <Text style={{ color: macro.val === v ? ACCENT.lime : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 12 }}>{v}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>

                <Pressable onPress={handleSaveEdit} disabled={saving}
                  className="rounded-xl py-3.5 items-center" style={{ backgroundColor: ACCENT.lime, opacity: saving ? 0.5 : 1 }}>
                  <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold", fontSize: 16 }}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteConfirmId} transparent animationType="slide" onRequestClose={() => setDeleteConfirmId(null)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setDeleteConfirmId(null)}>
          <Pressable className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }} onStartShouldSetResponder={() => true}>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 8 }}>
              Delete this meal?
            </Text>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 20 }}>
              This will permanently remove this entry.
            </Text>
            <View className="flex-row gap-3">
              <Pressable onPress={() => setDeleteConfirmId(null)} className="flex-1 py-3.5 rounded-xl items-center" style={{ backgroundColor: c.buttonBg }}>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 15 }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleDelete} className="flex-1 py-3.5 rounded-xl items-center" style={{ backgroundColor: ACCENT.rose }}>
                <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 15 }}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}
