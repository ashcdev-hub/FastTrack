import React, { useState } from "react";
import { Pressable, View, Text, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useFoodLog } from "@/hooks/useFoodLog";
import { useProfile } from "@/hooks/useProfile";
import { useGoalStore } from "@/store/useGoalStore";
import { LogMealModal } from "@/components/LogMealModal";
import { FoodLogItem } from "@/components/FoodLogItem";
import { MealCalendarModal } from "@/components/MealCalendarModal";
import { LogFoodSkeleton } from "@/components/Skeleton";
import { ProgressRing } from "@/components/ProgressRing";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, MEAL_COLORS } from "@/lib/theme-colors";
import { DEFAULT_UNITS } from "@/lib/units";

const DEFAULT_QUICK_ADD = ["Boiled Egg", "Coffee", "Banana", "Greek Yogurt"];

export default function LogFoodScreen() {
  const { user } = useAuth();
  const { profile, saveQuickAddFoods } = useProfile(user?.id ?? null);
  const unitPrefs = profile?.unit_preferences ?? DEFAULT_UNITS;
  const { entries, totals, monthlyEntries, addEntries, deleteEntry, loading: foodLoading } = useFoodLog(user?.id);
  const goals = useGoalStore();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  const [showLogMeal, setShowLogMeal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const quickAddFoods: string[] = profile?.quick_add_foods ?? DEFAULT_QUICK_ADD;

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

  const mealTypes: ("breakfast" | "lunch" | "dinner" | "snack")[] = ["breakfast", "lunch", "dinner", "snack"];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      {/* Fixed Top App Bar */}
      <View style={{ backgroundColor: c.tabBarBg, borderBottomWidth: 1, borderBottomColor: "rgba(53,53,52,0.2)", paddingTop: 8 }}>
        <View className="flex-row justify-between items-center" style={{ height: 44, paddingHorizontal: 20 }}>
          <View className="flex-row items-center gap-2">
            <Image source={require("../../assets/icon.png")} style={{ width: 22, height: 22, borderRadius: 5 }} />
            <Text style={{ color: ACCENT.lime, fontFamily: "Inter_800ExtraBold", fontSize: 22, letterSpacing: -0.5 }}>FastTrack</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 85, paddingHorizontal: 20, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Log Meal CTA */}
        <Pressable
          onPress={() => setShowLogMeal(true)}
          className="rounded-xl py-4 mb-section-gap items-center flex-row justify-center gap-2"
          style={{ backgroundColor: ACCENT.lime }}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={22} color="#161e00" />
          <Text style={{ color: "#161e00", fontFamily: "Inter_800ExtraBold", fontSize: 17 }}>
            Log Meal
          </Text>
        </Pressable>

        {/* Meal Calendar Button */}
        <Pressable
          onPress={() => setShowCalendarModal(true)}
          className="rounded-xl py-3 mb-section-gap flex-row items-center justify-center gap-2"
          style={{ backgroundColor: c.buttonBg }}
        >
          <MaterialCommunityIcons name="calendar-month-outline" size={18} color={c.text} />
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>Meal Calendar</Text>
        </Pressable>

        {/* Today's Meals */}
        <View className="mb-section-gap">
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
      </ScrollView>

      {/* Log Meal Bottom Sheet */}
      {user && (
        <LogMealModal
          visible={showLogMeal}
          onClose={() => setShowLogMeal(false)}
          userId={user.id}
          quickAddFoods={quickAddFoods}
          onSaveQuickAdd={async (foods) => { await saveQuickAddFoods(foods); }}
          onLogMeal={addEntries as any}
        />
      )}

      {/* Meal Calendar */}
      <MealCalendarModal visible={showCalendarModal} entries={monthlyEntries} onClose={() => setShowCalendarModal(false)} />
    </SafeAreaView>
  );
}
