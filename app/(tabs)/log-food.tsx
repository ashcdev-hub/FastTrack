import React, { useState } from "react";
import { Pressable, View, Text, ScrollView } from "react-native";
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
import { getThemeColors } from "@/lib/theme-colors";
import { format } from "date-fns";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const mealColors: Record<string, string> = {
  breakfast: "#F59E0B",
  lunch: "#10B981",
  dinner: "#3B82F6",
  snack: "#8B5CF6",
};

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
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  if (isToday) return `Today at ${timeStr}`;
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${dateStr} at ${timeStr}`;
}

function isFutureDate(date: Date): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return checkDate > today;
}

function isFutureTime(date: Date, hour: number, minute: number): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (checkDate > today) return true;
  if (checkDate < today) return false;
  const checkTime = hour * 60 + minute;
  const nowTime = now.getHours() * 60 + now.getMinutes();
  return checkTime > nowTime;
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

  const handleAddFromSearch = (item: {
    name: string;
    brand: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    serving_size?: string;
    quantity: number;
  }) => {
    const stagedItem: StagedItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...item,
    };
    setStagedItems((prev) => [...prev, stagedItem]);
  };

  const handleAddCustomItem = (item: {
    name: string;
    brand: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    serving_size?: string;
    quantity: number;
  }) => {
    const stagedItem: StagedItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...item,
    };
    setStagedItems((prev) => [...prev, stagedItem]);
    setShowCustomItemModal(false);
  };

  const handleRemoveItem = (id: string) => {
    setStagedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleLogMeal = async () => {
    if (!user || stagedItems.length === 0) return;

    const entries = stagedItems.map((item) => ({
      user_id: user.id,
      name: item.name,
      brand: item.brand ?? null,
      serving_size: item.serving_size ?? null,
      calories: Math.round(item.calories * item.quantity),
      protein_g: Math.round(item.protein_g * item.quantity * 10) / 10,
      carbs_g: Math.round(item.carbs_g * item.quantity * 10) / 10,
      fat_g: Math.round(item.fat_g * item.quantity * 10) / 10,
      meal_type: mealType,
      logged_at: loggedAt.toISOString(),
      session_id: null,
    }));

    const { error } = await addEntries(entries);
    if (!error) {
      setStagedItems([]);
    }
  };

  const applyDateTime = () => {
    const newDate = new Date(pickerDate);
    newDate.setHours(pickerHour, pickerMinute, 0, 0);
    setLoggedAt(newDate);
    setShowDateTimePicker(false);
  };

  const openDateTimePicker = () => {
    setPickerDate(new Date(loggedAt));
    setPickerHour(loggedAt.getHours());
    setPickerMinute(loggedAt.getMinutes());
    setShowDateTimePicker(true);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Group today's meals by meal type
  const mealsByType = entries.reduce(
    (acc, entry) => {
      if (!acc[entry.meal_type]) acc[entry.meal_type] = [];
      acc[entry.meal_type].push(entry);
      return acc;
    },
    {} as Record<string, typeof entries>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme === "dark" ? "#0F172A" : "#F9FAFB" }}>
      <ScrollView contentContainerClassName="px-6 py-8">
        <AppHeader title="Log Food" />

        {/* Meal Type Selector */}
        <Text style={{ color: c.textSecondary }} className="text-xs font-bold mb-2 tracking-wider">
          MEAL TYPE
        </Text>
        <View className="flex-row gap-2 mb-6">
          {mealTypes.map((type) => (
            <Pressable
              key={type}
              onPress={() => setMealType(type)}
              className="flex-1 py-3 rounded-xl"
              style={
                mealType === type
                  ? { backgroundColor: mealColors[type] }
                  : { backgroundColor: c.buttonBg }
              }
            >
              <Text
                className="text-center font-semibold capitalize"
                style={{ color: mealType === type ? "#FFFFFF" : c.textSecondary }}
              >
                {type}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* When Did You Eat? */}
        <Text style={{ color: c.textSecondary }} className="text-xs font-bold mb-2 tracking-wider">
          WHEN DID YOU EAT?
        </Text>
        <Pressable
          onPress={openDateTimePicker}
          className="rounded-xl px-4 py-3 mb-6 flex-row items-center justify-between"
          style={{ backgroundColor: c.inputBg }}
        >
          <Text style={{ color: c.text }} className="text-sm">{formatDateTime(loggedAt)}</Text>
          <Text className="text-blue-400 text-sm font-semibold">Change</Text>
        </Pressable>

        {/* Search Food */}
        <View className="mb-6">
          <FoodSearch onAdd={handleAddFromSearch} />
        </View>

        {/* Add Custom Item Button */}
        <Pressable
          onPress={() => setShowCustomItemModal(true)}
          className="rounded-xl py-3 mb-6"
          style={{ backgroundColor: c.buttonBg }}
        >
          <Text style={{ color: c.text }} className="text-center font-semibold">
            + Add Custom Item
          </Text>
        </Pressable>

        {/* Meal Builder (Staging Area) */}
        <View className="mb-6">
          <MealBuilder
            items={stagedItems}
            mealType={mealType}
            onRemove={handleRemoveItem}
            onLog={handleLogMeal}
          />
        </View>

        {/* Today's Meals */}
        <View className="mb-6">
          <Text style={{ color: c.text }} className="text-lg font-bold mb-4">
            Today&apos;s Meals
          </Text>
          {foodLoading ? (
            <LogFoodSkeleton />
          ) : Object.keys(mealsByType).length === 0 ? (
            <View
              className="rounded-xl p-6 items-center"
              style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}
            >
              <Text style={{ color: c.textMuted }}>
                No meals logged today
              </Text>
            </View>
          ) : (
            mealTypes.map((type) => {
              const items = mealsByType[type];
              if (!items || items.length === 0) return null;
              const color = mealColors[type];
              return (
                <View key={type} className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <View
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: color }}
                    />
                    <Text style={{ color: c.textSecondary }} className="text-xs font-bold tracking-wider">
                      {type.toUpperCase()}
                    </Text>
                  </View>
                  {items.map((entry) => (
                    <FoodLogItem
                      key={entry.id}
                      entry={entry}
                      onDelete={deleteEntry}
                    />
                  ))}
                </View>
              );
            })
          )}
        </View>

        {/* Water Tracker */}
        <View className="mb-6">
          <WaterTracker
            currentMl={totalMl}
            goalMl={goals.waterGoalMl}
            onAdd={addWater}
          />
        </View>
      </ScrollView>

      {/* Custom Item Modal */}
      {showCustomItemModal && (
        <View className="absolute inset-0 bg-black/50 justify-end">
          <View className="rounded-t-3xl" style={{ backgroundColor: theme === "dark" ? "#1E293B" : "#FFFFFF" }}>
            <MealForm
              onSubmit={handleAddCustomItem}
              onCancel={() => setShowCustomItemModal(false)}
            />
          </View>
        </View>
      )}

      {/* Date/Time Picker Modal */}
      {showDateTimePicker && (
        <View className="absolute inset-0 bg-black/50 justify-end">
          <View className="rounded-t-3xl p-6" style={{ backgroundColor: theme === "dark" ? "#1E293B" : "#FFFFFF" }}>
            <View className="flex-row justify-between items-center mb-4">
              <Pressable
                onPress={() => setShowDateTimePicker(false)}
              >
                <Text style={{ color: c.textSecondary }} className="text-base">Cancel</Text>
              </Pressable>
              <Text style={{ color: c.text }} className="text-lg font-bold">Select Time</Text>
              <Pressable
                onPress={applyDateTime}
              >
                <Text className="text-blue-400 text-base font-semibold">Done</Text>
              </Pressable>
            </View>

            <View className="flex-row justify-center gap-6 mb-6">
              <View className="items-center">
                <Text style={{ color: c.textSecondary }} className="text-xs mb-2">Hour</Text>
                <ScrollView className="h-32 w-16" showsVerticalScrollIndicator={false}>
                  {hours.map((h) => {
                    const isDisabled = isFutureTime(pickerDate, h, pickerMinute);
                    return (
                      <Pressable
                        key={h}
                        onPress={() => !isDisabled && setPickerHour(h)}
                        disabled={isDisabled}
                        className="py-2 items-center rounded-lg"
                        style={{
                          backgroundColor: pickerHour === h ? "rgba(59,130,246,0.3)" : "transparent",
                          opacity: isDisabled ? 0.3 : 1,
                        }}
                      >
                        <Text
                          className="text-lg"
                          style={{
                            color: pickerHour === h ? "#60A5FA" : c.textSecondary,
                            fontWeight: pickerHour === h ? "bold" : "normal",
                          }}
                        >
                          {h.toString().padStart(2, "0")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <Text style={{ color: c.text }} className="text-2xl mt-6">:</Text>

              <View className="items-center">
                <Text style={{ color: c.textSecondary }} className="text-xs mb-2">Minute</Text>
                <ScrollView className="h-32 w-16" showsVerticalScrollIndicator={false}>
                  {minutes.map((m) => {
                    const isDisabled = isFutureTime(pickerDate, pickerHour, m);
                    return (
                      <Pressable
                        key={m}
                        onPress={() => !isDisabled && setPickerMinute(m)}
                        disabled={isDisabled}
                        className="py-2 items-center rounded-lg"
                        style={{
                          backgroundColor: pickerMinute === m ? "rgba(59,130,246,0.3)" : "transparent",
                          opacity: isDisabled ? 0.3 : 1,
                        }}
                      >
                        <Text
                          className="text-lg"
                          style={{
                            color: pickerMinute === m ? "#60A5FA" : c.textSecondary,
                            fontWeight: pickerMinute === m ? "bold" : "normal",
                          }}
                        >
                          {m.toString().padStart(2, "0")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View className="flex-row justify-center gap-3 mb-4">
              <Pressable
                onPress={() => {
                  const d = new Date(pickerDate);
                  d.setDate(d.getDate() - 1);
                  setPickerDate(d);
                }}
                className="rounded-xl px-4 py-2"
                style={{ backgroundColor: c.buttonBg }}
              >
                <Text style={{ color: c.text }} className="text-sm">Yesterday</Text>
              </Pressable>
              <Pressable
                onPress={() => setPickerDate(new Date())}
                className="rounded-xl px-4 py-2"
                style={{ backgroundColor: c.buttonBg }}
              >
                <Text style={{ color: c.text }} className="text-sm">Today</Text>
              </Pressable>
            </View>

            <Text style={{ color: c.textMuted }} className="text-center text-sm">
              {pickerDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
