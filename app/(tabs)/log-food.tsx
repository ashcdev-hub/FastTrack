import React, { useState } from "react";
import { Pressable, View, Text, ScrollView, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { useFoodLog } from "@/hooks/useFoodLog";
import { useWaterLog } from "@/hooks/useWaterLog";
import { useGoalStore } from "@/store/useGoalStore";
import { MealForm } from "@/components/MealForm";
import { FoodSearch } from "@/components/FoodSearch";
import { WaterTracker } from "@/components/WaterTracker";
import { MealBuilder, StagedItem } from "@/components/MealBuilder";
import { FoodLogItem } from "@/components/FoodLogItem";
import { AppHeader } from "@/components/AppHeader";
import { LogFoodSkeleton } from "@/components/Skeleton";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, MEAL_COLORS } from "@/lib/theme-colors";
import SpoonAndForkIcon from "@hugeicons/core-free-icons/dist/esm/SpoonAndForkIcon";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const getDefaultMealType = (): MealType => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 21) return "dinner";
  return "snack";
};

function formatDateTime(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  if (isToday) return `Today at ${timeStr}`;
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${dateStr} at ${timeStr}`;
}

function isFutureTime(date: Date, hour: number, minute: number): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (checkDate > today) return true;
  if (checkDate < today) return false;
  return hour * 60 + minute > now.getHours() * 60 + now.getMinutes();
}

export default function LogFoodScreen() {
  const { user } = useAuth();
  const { entries, totals, addEntries, deleteEntry, loading: foodLoading } = useFoodLog(user?.id);
  const { totalMl, addWater } = useWaterLog(user?.id);
  const goals = useGoalStore();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  const [mealType, setMealType] = useState<MealType>(getDefaultMealType());
  const [loggedAt, setLoggedAt] = useState(new Date());
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [pickerHour, setPickerHour] = useState(new Date().getHours());
  const [pickerMinute, setPickerMinute] = useState(new Date().getMinutes());

  const handleAddFromSearch = (item: { name: string; brand: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; serving_size?: string; quantity: number }) => {
    setStagedItems((prev) => [...prev, { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), ...item }]);
  };

  const handleAddCustomItem = (item: { name: string; brand: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; serving_size?: string; quantity: number }) => {
    setStagedItems((prev) => [...prev, { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), ...item }]);
    setShowCustomItemModal(false);
  };

  const handleRemoveItem = (id: string) => { setStagedItems((prev) => prev.filter((item) => item.id !== id)); };

  const handleLogMeal = async () => {
    if (!user || stagedItems.length === 0) return;
    const es = stagedItems.map((item) => ({
      user_id: user.id, name: item.name, brand: item.brand ?? null, serving_size: item.serving_size ?? null,
      calories: Math.round(item.calories * item.quantity), protein_g: Math.round(item.protein_g * item.quantity * 10) / 10,
      carbs_g: Math.round(item.carbs_g * item.quantity * 10) / 10, fat_g: Math.round(item.fat_g * item.quantity * 10) / 10,
      meal_type: mealType, logged_at: loggedAt.toISOString(), session_id: null,
    }));
    const { error } = await addEntries(es);
    if (!error) setStagedItems([]);
  };

  const applyDateTime = () => {
    const newDate = new Date(pickerDate);
    newDate.setHours(pickerHour, pickerMinute, 0, 0);
    setLoggedAt(newDate);
    setShowDateTimePicker(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const mealsByType = entries.reduce((acc, entry) => {
    if (!acc[entry.meal_type]) acc[entry.meal_type] = [];
    acc[entry.meal_type].push(entry);
    return acc;
  }, {} as Record<string, typeof entries>);

  const inputStyle = { backgroundColor: c.inputBg, color: c.text, fontFamily: "PlusJakartaSans_500Medium" as const };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      <ScrollView contentContainerClassName="px-6" style={{ paddingTop: 32, paddingBottom: 120 }}>
        <AppHeader title="Log" showLogo logoIcon={SpoonAndForkIcon} />

        <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs mb-2 tracking-widest">MEAL TYPE</Text>
        <View className="flex-row gap-2 mb-6">
          {mealTypes.map((type) => (
            <Pressable
              key={type}
              onPress={() => setMealType(type)}
              className="flex-1 py-3 rounded-xl"
              style={{ backgroundColor: mealType === type ? MEAL_COLORS[type] : c.buttonBg }}
            >
              <Text
                className="text-center capitalize"
                style={{ color: mealType === type ? c.textOnDark : c.textSecondary, fontFamily: "PlusJakartaSans_600SemiBold" }}
              >
                {type}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs mb-2 tracking-widest">WHEN DID YOU EAT?</Text>
        <Pressable
          onPress={() => { setPickerDate(new Date(loggedAt)); setPickerHour(loggedAt.getHours()); setPickerMinute(loggedAt.getMinutes()); setShowDateTimePicker(true); }}
          className="rounded-xl px-4 py-3 mb-6 flex-row items-center justify-between"
          style={{ backgroundColor: c.inputBg }}
        >
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">{formatDateTime(loggedAt)}</Text>
          <Text style={{ color: ACCENT.mint, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-sm">Change</Text>
        </Pressable>

        <View className="mb-6"><FoodSearch onAdd={handleAddFromSearch} /></View>

        <Pressable
          onPress={() => setShowCustomItemModal(true)}
          className="rounded-xl py-3 mb-6"
          style={{ backgroundColor: c.buttonBg }}
        >
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-center">+ Add Custom Item</Text>
        </Pressable>

        <View className="mb-6">
          <MealBuilder items={stagedItems} mealType={mealType} onRemove={handleRemoveItem} onLog={handleLogMeal} />
        </View>

        <View className="mb-6">
          <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-lg mb-4">Today&apos;s Meals</Text>
          {foodLoading ? (
            <LogFoodSkeleton />
          ) : Object.keys(mealsByType).length === 0 ? (
            <View className="rounded-xl p-6 items-center" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
              <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }}>No meals logged today</Text>
            </View>
          ) : (
            mealTypes.map((type) => {
              const items = mealsByType[type];
              if (!items || items.length === 0) return null;
              const color = MEAL_COLORS[type];
              return (
                <View key={type} className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: color }} />
                    <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_600SemiBold" }} className="text-xs tracking-widest">
                      {type.toUpperCase()}
                    </Text>
                  </View>
                  {items.map((entry) => (
                    <FoodLogItem key={entry.id} entry={entry} onDelete={deleteEntry} />
                  ))}
                </View>
              );
            })
          )}
        </View>

        <View className="mb-6">
          <WaterTracker currentMl={totalMl} goalMl={goals.waterGoalMl} onAdd={addWater} />
        </View>
      </ScrollView>

      {/* Custom Item Modal */}
      <Modal visible={showCustomItemModal} transparent animationType="slide" onRequestClose={() => setShowCustomItemModal(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowCustomItemModal(false)}>
          <Pressable className="rounded-t-3xl" style={{ backgroundColor: c.elevated }} onStartShouldSetResponder={() => true}>
            <MealForm onSubmit={handleAddCustomItem} onCancel={() => setShowCustomItemModal(false)} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Date/Time Picker Modal */}
      <Modal visible={showDateTimePicker} transparent animationType="slide" onRequestClose={() => setShowDateTimePicker(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowDateTimePicker(false)}>
          <Pressable className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }} onStartShouldSetResponder={() => true}>
            <View className="flex-row justify-between items-center mb-4">
              <Pressable onPress={() => setShowDateTimePicker(false)}>
                <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_500Medium" }}>Cancel</Text>
              </Pressable>
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-lg">Select Time</Text>
              <Pressable onPress={applyDateTime}>
                <Text style={{ color: ACCENT.mint, fontFamily: "PlusJakartaSans_600SemiBold" }}>Done</Text>
              </Pressable>
            </View>

            <View className="flex-row justify-center gap-6 mb-6">
              <View className="items-center">
                <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-2">Hour</Text>
                <ScrollView className="h-32 w-16" showsVerticalScrollIndicator={false}>
                  {hours.map((h) => {
                    const isDisabled = isFutureTime(pickerDate, h, pickerMinute);
                    return (
                      <Pressable key={h} onPress={() => !isDisabled && setPickerHour(h)} disabled={isDisabled} className="py-2 items-center rounded-lg"
                        style={{ backgroundColor: pickerHour === h ? ACCENT.mintBg : "transparent", opacity: isDisabled ? 0.3 : 1 }}>
                        <Text className="text-lg" style={{ color: pickerHour === h ? ACCENT.mint : c.textSecondary, fontFamily: pickerHour === h ? "PlusJakartaSans_700Bold" : "PlusJakartaSans_400Regular" }}>
                          {h.toString().padStart(2, "0")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
              <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-2xl mt-6">:</Text>
              <View className="items-center">
                <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs mb-2">Minute</Text>
                <ScrollView className="h-32 w-16" showsVerticalScrollIndicator={false}>
                  {minutes.map((m) => {
                    const isDisabled = isFutureTime(pickerDate, pickerHour, m);
                    return (
                      <Pressable key={m} onPress={() => !isDisabled && setPickerMinute(m)} disabled={isDisabled} className="py-2 items-center rounded-lg"
                        style={{ backgroundColor: pickerMinute === m ? ACCENT.mintBg : "transparent", opacity: isDisabled ? 0.3 : 1 }}>
                        <Text className="text-lg" style={{ color: pickerMinute === m ? ACCENT.mint : c.textSecondary, fontFamily: pickerMinute === m ? "PlusJakartaSans_700Bold" : "PlusJakartaSans_400Regular" }}>
                          {m.toString().padStart(2, "0")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View className="flex-row justify-center gap-3 mb-4">
              <Pressable onPress={() => { const d = new Date(pickerDate); d.setDate(d.getDate() - 1); setPickerDate(d); }} className="rounded-xl px-4 py-2" style={{ backgroundColor: c.buttonBg }}>
                <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">Yesterday</Text>
              </Pressable>
              <Pressable onPress={() => setPickerDate(new Date())} className="rounded-xl px-4 py-2" style={{ backgroundColor: c.buttonBg }}>
                <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm">Today</Text>
              </Pressable>
            </View>

            <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-center text-sm">
              {pickerDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
