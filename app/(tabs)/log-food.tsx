import React, { useState, useRef } from "react";
import { Pressable, View, Text, TextInput, ScrollView, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useFoodLog } from "@/hooks/useFoodLog";
import { useProfile } from "@/hooks/useProfile";
import { useMyMeals } from "@/hooks/useMyMeals";
import { useGoalStore } from "@/store/useGoalStore";
import { LogMealModal } from "@/components/LogMealModal";
import { FoodLogItem } from "@/components/FoodLogItem";
import { MealCalendarModal } from "@/components/MealCalendarModal";
import { LogFoodSkeleton } from "@/components/Skeleton";
import { ProgressRing } from "@/components/ProgressRing";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors, getMealColors } from "@/lib/theme-colors";
import { DEFAULT_UNITS } from "@/lib/units";

const DEFAULT_QUICK_ADD = ["Boiled Egg", "Coffee", "Banana", "Greek Yogurt"];
import { useScrollToTop } from "@react-navigation/native";

export default function LogFoodScreen() {
  const { user } = useAuth();
  const { profile, saveQuickAddFoods } = useProfile(user?.id ?? null);
  const unitPrefs = profile?.unit_preferences ?? DEFAULT_UNITS;
  const { entries, totals, monthlyEntries, addEntries, deleteEntry, updateEntry, recentFoods, loading: foodLoading } = useFoodLog(user?.id);
  const { meals: myMeals, addMyMeal, bumpUsage: bumpMyMealUsage } = useMyMeals(user?.id);
  const goals = useGoalStore();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const mealColors = getMealColors(theme);

  const [showLogMeal, setShowLogMeal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showSaveMealPrompt, setShowSaveMealPrompt] = useState(false);
  const [saveMealPromptItems, setSaveMealPromptItems] = useState<{ name: string; brand: string | null; serving_size: string | null; calories: number; protein_g: number; carbs_g: number; fat_g: number }[]>([]);
  const [saveMealPromptName, setSaveMealPromptName] = useState("");

  const quickAddFoods: string[] = profile?.quick_add_foods ?? DEFAULT_QUICK_ADD;

  const mealsByType = entries.reduce<Record<string, typeof entries>>((acc, entry) => {
    if (!acc[entry.meal_type]) acc[entry.meal_type] = [];
    acc[entry.meal_type].push(entry);
    return acc;
  }, {});

  const remainingKcal = Math.max(goals.dailyCalories - totals.calories, 0);
  const macroRings = [
    { label: "PRO", current: totals.protein_g, goal: goals.dailyProtein, color: accent.lime },
    { label: "CARB", current: totals.carbs_g, goal: goals.dailyCarbs, color: accent.cyan },
    { label: "FAT", current: totals.fat_g, goal: goals.dailyFat, color: "#ffb4ab" },
  ];

  const mealTypes: ("breakfast" | "lunch" | "dinner" | "snack")[] = ["breakfast", "lunch", "dinner", "snack"];
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef as any);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      {/* Fixed Top App Bar */}
      <View style={{ backgroundColor: c.tabBarBg, borderBottomWidth: 1, borderBottomColor: c.tabBarBorder, paddingTop: 8 }}>
        <View className="flex-row justify-between items-center" style={{ height: 44, paddingHorizontal: 20 }}>
          <View className="flex-row items-center gap-2">
            <Image source={require("../../assets/icon.png")} style={{ width: 22, height: 22, borderRadius: 5 }} />
            <Text style={{ color: accent.lime, fontFamily: "Inter_800ExtraBold", fontSize: 22, letterSpacing: -0.5 }}>FastTrack</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
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
          style={{ backgroundColor: accent.lime }}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={22} color={c.textOnAccent} />
          <Text style={{ color: c.textOnAccent, fontFamily: "Inter_800ExtraBold", fontSize: 17 }}>
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
              const color = mealColors[type];
              return (
                  <View key={type} className="mb-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 8 }} />
                        <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
                          {type}
                        </Text>
                      </View>
                      <Pressable onPress={() => {
                        setSaveMealPromptItems(items.map((e) => ({ name: e.name, brand: e.brand ?? null, serving_size: e.serving_size ?? null, calories: e.calories ?? 0, protein_g: e.protein_g ?? 0, carbs_g: e.carbs_g ?? 0, fat_g: e.fat_g ?? 0 })));
                        setSaveMealPromptName(`${type.charAt(0).toUpperCase() + type.slice(1)} Meal`);
                        setShowSaveMealPrompt(true);
                      }} className="flex-row items-center gap-1">
                        <MaterialCommunityIcons name="bookmark-outline" size={14} color={accent.cyan} />
                        <Text style={{ color: accent.cyan, fontFamily: "Inter_700Bold", fontSize: 11 }}>Save</Text>
                      </Pressable>
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
          recentFoods={recentFoods}
          myMeals={myMeals}
          onSaveQuickAdd={async (foods) => { await saveQuickAddFoods(foods); }}
          onLogMeal={addEntries as any}
          onSaveAsMeal={async (name, items) => { await addMyMeal(name, items.map((i) => ({ name: i.name, brand: i.brand, serving_size: i.serving_size, calories: i.calories, protein_g: i.protein_g, carbs_g: i.carbs_g, fat_g: i.fat_g }))); }}
          onBumpMyMealUsage={(id) => { bumpMyMealUsage(id); }}
          onSaveItemToQuickAdd={async (name) => {
            const newFoods = quickAddFoods.includes(name) ? quickAddFoods : [...quickAddFoods, name];
            await saveQuickAddFoods(newFoods);
          }}
        />
      )}

      {/* Meal Calendar */}
      <MealCalendarModal
        visible={showCalendarModal}
        entries={monthlyEntries}
        onClose={() => setShowCalendarModal(false)}
        onDeleteEntry={async (id) => { await deleteEntry(id); }}
        onUpdateEntry={async (id, updates) => { await updateEntry({ id, updates }); }}
        onSaveAsMeal={(items) => {
          setSaveMealPromptItems(items.map((e) => ({ name: e.name, brand: e.brand ?? null, serving_size: e.serving_size ?? null, calories: e.calories ?? 0, protein_g: e.protein_g ?? 0, carbs_g: e.carbs_g ?? 0, fat_g: e.fat_g ?? 0 })));
          const date = items[0]?.logged_at ? new Date(items[0].logged_at) : new Date();
          setSaveMealPromptName(date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " Meals");
          setShowSaveMealPrompt(true);
        }}
      />

      {/* Save as Meal Prompt */}
      <Modal visible={showSaveMealPrompt} transparent animationType="fade" onRequestClose={() => setShowSaveMealPrompt(false)}>
        <Pressable className="flex-1 justify-center items-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setShowSaveMealPrompt(false)}>
          <Pressable onStartShouldSetResponder={() => true} className="rounded-2xl p-6 w-80" style={{ backgroundColor: c.elevated }}>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 4 }}>Save as Meal</Text>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 16 }}>
              {saveMealPromptItems.length} {saveMealPromptItems.length === 1 ? "item" : "items"} will be saved as a reusable meal template.
            </Text>
            <TextInput
              value={saveMealPromptName}
              onChangeText={setSaveMealPromptName}
              placeholder="e.g. Breakfast Meal"
              placeholderTextColor={c.placeholder}
              className="rounded-xl px-4 py-3 mb-4"
              style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 15 }}
              autoFocus
            />
            <View className="flex-row gap-3">
              <Pressable onPress={() => setShowSaveMealPrompt(false)} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: c.buttonBg }}>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15 }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={async () => {
                if (!saveMealPromptName.trim()) return;
                await addMyMeal(saveMealPromptName.trim(), saveMealPromptItems);
                setShowSaveMealPrompt(false);
                setSaveMealPromptName("");
              }} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: saveMealPromptName.trim() ? accent.lime : c.buttonBg }} disabled={!saveMealPromptName.trim()}>
                <Text style={{ color: saveMealPromptName.trim() ? c.textOnAccent : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 15 }}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
