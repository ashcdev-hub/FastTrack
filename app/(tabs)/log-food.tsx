import React, { useState } from "react";
import { Pressable, View, Text, ScrollView, TextInput, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useFoodLog } from "@/hooks/useFoodLog";
import { useWaterLog } from "@/hooks/useWaterLog";
import { useGoalStore } from "@/store/useGoalStore";
import { useProfile } from "@/hooks/useProfile";
import { MealForm } from "@/components/MealForm";
import { FoodSearch } from "@/components/FoodSearch";
import { WaterTracker } from "@/components/WaterTracker";
import { MealBuilder, StagedItem } from "@/components/MealBuilder";
import { FoodLogItem } from "@/components/FoodLogItem";
import { LogFoodSkeleton } from "@/components/Skeleton";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, MEAL_COLORS } from "@/lib/theme-colors";
import { DEFAULT_UNITS } from "@/lib/units";
import { ProgressRing } from "@/components/ProgressRing";

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
  const { profile } = useProfile(user?.id ?? null);
  const unitPrefs = profile?.unit_preferences ?? DEFAULT_UNITS;
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
    try {
      await addEntries(es);
      setStagedItems([]);
    } catch (err) {
      console.error("Failed to log meals:", err);
    }
  };

  const applyDateTime = () => {
    const newDate = new Date(pickerDate);
    newDate.setHours(pickerHour, pickerMinute, 0, 0);
    setLoggedAt(newDate);
    setShowDateTimePicker(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const mealsByType = entries.reduce<Record<string, typeof entries>>((acc, entry) => {
    if (!acc[entry.meal_type]) acc[entry.meal_type] = [];
    acc[entry.meal_type].push(entry);
    return acc;
  }, {});

  const remainingKcal = Math.max(goals.dailyCalories - totals.calories, 0);
  const macroRings = [
    { label: "PRO", current: totals.protein_g, goal: goals.dailyProtein, color: ACCENT.lime },
    { label: "CARB", current: totals.carbs_g, goal: goals.dailyCarbs, color: ACCENT.cyan },
    { label: "FAT", current: totals.fat_g, goal: goals.dailyFat, color: "#ffb4ab" },
  ];

  const quickAdds = [
    { name: "Eggs", kcal: 70, icon: "egg-outline" as const },
    { name: "Rice", kcal: 130, icon: "rice" as const },
    { name: "Chicken Breast", kcal: 165, icon: "food-apple" as const },
    { name: "Coffee", kcal: 2, icon: "coffee-outline" as const },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      {/* Fixed Top App Bar */}
      <View style={{ backgroundColor: c.tabBarBg, borderBottomWidth: 1, borderBottomColor: "rgba(53,53,52,0.2)", paddingTop: 8 }}>
        <View className="flex-row justify-between items-center" style={{ height: 44, paddingHorizontal: 20 }}>
          <View className="flex-row items-center gap-3">
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.elevated, borderWidth: 1, borderColor: c.cardBorder, alignItems: "center", justifyContent: "center" }}>
              <MaterialCommunityIcons name="account" size={16} color={c.textSecondary} />
            </View>
            <Text style={{ color: ACCENT.lime, fontFamily: "Inter_800ExtraBold", fontSize: 22, letterSpacing: -0.5 }}>FastTrack</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View className="mb-section-gap mt-4">
          <View className="relative flex-row items-center">
            <MaterialCommunityIcons name="magnify" size={20} color={c.textMuted} style={{ position: "absolute", left: 16, zIndex: 1 }} />
            <TextInput
              placeholder="Search food database..."
              placeholderTextColor={c.placeholder}
              className="flex-1 h-12 rounded-lg pl-12 pr-12 glass-panel"
              style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 16 }}
            />
            <Pressable style={{ position: "absolute", right: 16, zIndex: 1 }}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color={ACCENT.lime} />
            </Pressable>
          </View>
        </View>

        {/* Daily Macro Goal Summary */}
        <View className="rounded-xl p-5 mb-section-gap glass-panel">
          <View className="flex-row justify-between items-end mb-6">
            <View>
              <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>
                CALORIES REMAINING
              </Text>
              <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 40, letterSpacing: -1 }}>
                {remainingKcal.toLocaleString()} <Text style={{ fontFamily: "Inter_400Regular", fontSize: 16, color: c.textMuted }}>kcal</Text>
              </Text>
            </View>
            <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12 }}>
              GOAL: {goals.dailyCalories.toLocaleString()}
            </Text>
          </View>
          <View className="flex-row justify-between">
            {macroRings.map((macro) => {
              const pct = macro.goal > 0 ? Math.min(macro.current / macro.goal, 1) : 0;
              return (
                <View key={macro.label} className="flex-col items-center">
                  <ProgressRing size={80} progress={pct} strokeWidth={10} indicatorColor={macro.color}>
                    <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 1 }}>{macro.label}</Text>
                  </ProgressRing>
                  <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, marginTop: 8 }}>
                    {Math.round(macro.current)} / {macro.goal}g
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick Add Grid */}
        <View className="mb-section-gap">
          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>
            QUICK ADD
          </Text>
          <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
            {quickAdds.map((item) => (
              <Pressable
                key={item.name}
                className="w-1/2"
                style={{ paddingHorizontal: 6, marginBottom: 12 }}
              >
                <View className="rounded-lg p-4 flex-row items-center gap-3 glass-panel">
                  <View className="glass-panel" style={{ width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" }}>
                    <MaterialCommunityIcons name={item.icon} size={20} color={ACCENT.lime} />
                  </View>
                  <View>
                    <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>{item.name}</Text>
                    <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10 }}>{item.kcal} KCAL</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Water Tracker */}
        <View className="glass-panel p-5 mb-section-gap" style={{ borderLeftWidth: 4, borderLeftColor: ACCENT.cyan }}>
          <View className="flex-row justify-between items-center mb-4">
            <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
              WATER TRACKER
            </Text>
            <Text style={{ color: ACCENT.cyan, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 24 }}>
              {(totalMl / 1000).toFixed(1)} <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: c.textMuted }}>/ {goals.waterGoalMl / 1000}L</Text>
            </Text>
          </View>
          <View className="h-3 rounded-full overflow-hidden mb-6" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
            <View className="h-full rounded-full" style={{ width: `${Math.min(totalMl / goals.waterGoalMl, 1) * 100}%`, backgroundColor: ACCENT.cyan }} />
          </View>
          <View className="flex-row gap-2">
            {[250, 500, 750].map((ml) => (
              <Pressable
                key={ml}
                onPress={() => addWater(ml)}
                className="flex-1 py-3 rounded items-center glass-panel"
              >
                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 1 }}>{ml}ML</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Meal Type Selector */}
        <View className="glass-panel p-3 mb-6">
          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
            MEAL TYPE
          </Text>
          <View className="flex-row gap-2">
            {mealTypes.map((type) => {
              const isActive = mealType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setMealType(type)}
                  className="flex-1 py-2.5 rounded-lg items-center"
                  style={{ backgroundColor: isActive ? ACCENT.lime : c.buttonBg }}
                >
                  <View className="flex-row items-center gap-1.5">
                    {isActive && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#161e00" }} />}
                    <Text
                      style={{ color: isActive ? "#161e00" : c.textMuted, fontFamily: isActive ? "Inter_700Bold" : "Inter_400Regular", fontSize: 11 }}
                    >
                      {type}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Date/Time Picker */}
        <Pressable
          onPress={() => { setPickerDate(new Date(loggedAt)); setPickerHour(loggedAt.getHours()); setPickerMinute(loggedAt.getMinutes()); setShowDateTimePicker(true); }}
          className="glass-panel rounded-lg px-4 py-3 mb-6 flex-row items-center justify-between"
        >
          <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}>{formatDateTime(loggedAt)}</Text>
          <Text style={{ color: ACCENT.lime, fontFamily: "Inter_700Bold", fontSize: 14 }}>Change</Text>
        </Pressable>

        {/* FoodSearch */}
        <View className="mb-6"><FoodSearch onAdd={handleAddFromSearch} /></View>

        {/* Add Custom Item */}
        <Pressable
          onPress={() => setShowCustomItemModal(true)}
          className="rounded-lg py-3 mb-6 items-center"
          style={{ backgroundColor: c.buttonBg }}
        >
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>+ Add Custom Item</Text>
        </Pressable>

        {/* Meal Builder */}
        <View className="mb-6">
          <MealBuilder items={stagedItems} mealType={mealType} onRemove={handleRemoveItem} onLog={handleLogMeal} />
        </View>

        {/* Today's Meals */}
        <View className="mb-6">
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 16 }}>Today&apos;s Meals</Text>
          {foodLoading ? (
            <LogFoodSkeleton />
          ) : Object.keys(mealsByType).length === 0 ? (
            <View className="rounded-xl p-6 items-center glass-panel">
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }}>No meals logged today</Text>
            </View>
          ) : (
            mealTypes.map((type) => {
              const items = mealsByType[type];
              if (!items || items.length === 0) return null;
              const color = MEAL_COLORS[type];
              return (
                <View key={type} className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 8 }} />
                    <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
                      {type}
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

        {/* Legacy WaterTracker */}
        <View className="mb-6">
          <WaterTracker currentMl={totalMl} goalMl={goals.waterGoalMl} onAdd={addWater} unitPrefs={unitPrefs} />
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
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14 }}>Cancel</Text>
              </Pressable>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18 }}>Select Time</Text>
              <Pressable onPress={applyDateTime}>
                <Text style={{ color: ACCENT.lime, fontFamily: "Inter_700Bold", fontSize: 14 }}>Done</Text>
              </Pressable>
            </View>
            <View className="flex-row justify-center gap-6 mb-6">
              <View className="items-center">
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 8 }}>Hour</Text>
                <ScrollView className="h-32 w-16" showsVerticalScrollIndicator={false}>
                  {hours.map((h) => {
                    const isDisabled = isFutureTime(pickerDate, h, pickerMinute);
                    return (
                      <Pressable key={h} onPress={() => !isDisabled && setPickerHour(h)} disabled={isDisabled}
                        className="py-2 items-center rounded-lg"
                        style={{ backgroundColor: pickerHour === h ? ACCENT.limeBg : "transparent", opacity: isDisabled ? 0.3 : 1 }}>
                        <Text className="text-lg"
                          style={{ color: pickerHour === h ? ACCENT.lime : c.textMuted, fontFamily: pickerHour === h ? "Inter_700Bold" : "Inter_400Regular" }}>
                          {h.toString().padStart(2, "0")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 24, marginTop: 24 }}>:</Text>
              <View className="items-center">
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 8 }}>Minute</Text>
                <ScrollView className="h-32 w-16" showsVerticalScrollIndicator={false}>
                  {minutes.map((m) => {
                    const isDisabled = isFutureTime(pickerDate, pickerHour, m);
                    return (
                      <Pressable key={m} onPress={() => !isDisabled && setPickerMinute(m)} disabled={isDisabled}
                        className="py-2 items-center rounded-lg"
                        style={{ backgroundColor: pickerMinute === m ? ACCENT.limeBg : "transparent", opacity: isDisabled ? 0.3 : 1 }}>
                        <Text className="text-lg"
                          style={{ color: pickerMinute === m ? ACCENT.lime : c.textMuted, fontFamily: pickerMinute === m ? "Inter_700Bold" : "Inter_400Regular" }}>
                          {m.toString().padStart(2, "0")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
            <View className="flex-row justify-center gap-3 mb-4">
              <Pressable onPress={() => { const d = new Date(pickerDate); d.setDate(d.getDate() - 1); setPickerDate(d); }} className="rounded-lg px-4 py-2" style={{ backgroundColor: c.buttonBg }}>
                <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}>Yesterday</Text>
              </Pressable>
              <Pressable onPress={() => setPickerDate(new Date())} className="rounded-lg px-4 py-2" style={{ backgroundColor: c.buttonBg }}>
                <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}>Today</Text>
              </Pressable>
            </View>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" }}>
              {pickerDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
