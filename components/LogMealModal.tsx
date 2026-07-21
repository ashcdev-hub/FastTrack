import React, { useState, useRef, useEffect } from "react";
import { Pressable, View, Text, TextInput, ScrollView, Modal, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors, getMealColors } from "@/lib/theme-colors";
import { useFoodLogStore } from "@/store/useFoodLogStore";
import type { StagedItem } from "@/store/useFoodLogStore";
import { MealBuilder } from "@/components/MealBuilder";
import { EditQuickAddModal } from "@/components/EditQuickAddModal";
import { MyMealsManagerModal } from "@/components/MyMealsManagerModal";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { FoodCamera } from "@/components/FoodCamera";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import type { MyMeal } from "@/lib/types";

const FOOD_MACROS: Record<string, { cals: number; p: number; c: number; f: number }> = {
  "Boiled Egg": { cals: 78, p: 6.3, c: 0.6, f: 5.3 },
  "Fried Egg": { cals: 90, p: 6.3, c: 0.4, f: 6.8 },
  "Scrambled Eggs": { cals: 91, p: 6.1, c: 1.6, f: 6.7 },
  "White Rice (cooked)": { cals: 130, p: 2.7, c: 28.2, f: 0.3 },
  "Brown Rice (cooked)": { cals: 112, p: 2.6, c: 23.5, f: 0.9 },
  "Chicken Breast (cooked)": { cals: 165, p: 31, c: 0, f: 3.6 },
  "Whole Wheat Bread": { cals: 69, p: 3.6, c: 12.9, f: 0.9 },
  "White Bread": { cals: 66, p: 2.4, c: 12.4, f: 0.8 },
  "Banana": { cals: 105, p: 1.3, c: 27, f: 0.4 },
  "Apple": { cals: 95, p: 0.5, c: 25, f: 0.3 },
  "Greek Yogurt": { cals: 100, p: 17, c: 4, f: 0.7 },
  "Oatmeal (cooked)": { cals: 154, p: 5.4, c: 27, f: 2.6 },
  "Coffee": { cals: 2, p: 0.1, c: 0, f: 0.1 },
  "Milk": { cals: 149, p: 7.7, c: 12, f: 8 },
  "Orange Juice": { cals: 112, p: 1.7, c: 26, f: 0.5 },
  "Almonds": { cals: 164, p: 6, c: 6, f: 14 },
  "Peanut Butter": { cals: 188, p: 8, c: 6, f: 16 },
  "Avocado": { cals: 160, p: 2, c: 8.5, f: 14.7 },
  "Sweet Potato": { cals: 103, p: 2.3, c: 24, f: 0.2 },
  "Broccoli": { cals: 55, p: 3.7, c: 11, f: 0.6 },
  "Salmon": { cals: 206, p: 22, c: 0, f: 13 },
  "Beef (cooked)": { cals: 250, p: 26, c: 0, f: 15 },
  "Tofu": { cals: 76, p: 8, c: 1.9, f: 4.8 },
  "Pasta (cooked)": { cals: 220, p: 8, c: 43, f: 1.3 },
  "Cheese": { cals: 113, p: 7, c: 0.4, f: 9 },
  "Butter": { cals: 102, p: 0.1, c: 0, f: 11.5 },
  "Olive Oil": { cals: 119, p: 0, c: 0, f: 13.5 },
  "Honey": { cals: 64, p: 0.1, c: 17, f: 0 },
};

function formatDateTime(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  if (isToday) return `Today at ${timeStr}`;
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${dateStr} at ${timeStr}`;
}

type RecentFoodItem = {
  name: string;
  brand: string | null;
  serving_size: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

type LogMealModalProps = {
  visible: boolean;
  onClose: () => void;
  userId: string;
  quickAddFoods: string[];
  recentFoods?: RecentFoodItem[];
  myMeals?: MyMeal[];
  onSaveQuickAdd: (foods: string[]) => void;
  onLogMeal: (entries: {
    user_id: string; name: string; brand: string | null; serving_size: string | null;
    calories: number; protein_g: number; carbs_g: number; fat_g: number;
    meal_type: string; logged_at: string; session_id: null;
  }[]) => Promise<void>;
  onSaveAsMeal?: (name: string, items: { name: string; brand: string | null; serving_size: string | null; calories: number; protein_g: number; carbs_g: number; fat_g: number }[]) => Promise<any>;
  onBumpMyMealUsage?: (id: string) => void;
  onSaveItemToQuickAdd?: (name: string) => void;
};

export function LogMealModal({ visible, onClose, userId, quickAddFoods, recentFoods = [], myMeals = [], onSaveQuickAdd, onLogMeal, onSaveAsMeal, onBumpMyMealUsage, onSaveItemToQuickAdd }: LogMealModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const mealColors = getMealColors(theme);
  const insets = useSafeAreaInsets();
  const store = useFoodLogStore();
  const searchInputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<any>(undefined);
  const scrollRef = useRef<ScrollView>(null);
  const prevItemCountRef = useRef(0);

  useEffect(() => {
    if (store.stagedItems.length > prevItemCountRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
    }
    prevItemCountRef.current = store.stagedItems.length;
  }, [store.stagedItems.length]);

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showEditQuickAdd, setShowEditQuickAdd] = useState(false);
  const [showMyMealsManager, setShowMyMealsManager] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showFoodCamera, setShowFoodCamera] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [editingItem, setEditingItem] = useState<StagedItem | null>(null);
  const [eQty, setEQty] = useState(1);
  const [showSaveAsMeal, setShowSaveAsMeal] = useState(false);
  const [saveAsMealName, setSaveAsMealName] = useState("");
  const { toast, success, error } = useToast();
  const [eCals, setECals] = useState(0);
  const [eProtein, setEProtein] = useState(0);
  const [eCarbs, setECarbs] = useState(0);
  const [eFat, setEFat] = useState(0);

  useEffect(() => {
    if (editingItem) {
      setEQty(editingItem.quantity);
      setECals(editingItem.calories);
      setEProtein(editingItem.protein_g);
      setECarbs(editingItem.carbs_g);
      setEFat(editingItem.fat_g);
    }
  }, [editingItem]);

  const [pickerDate, setPickerDate] = useState(new Date());
  const [pickerHour, setPickerHour] = useState(new Date().getHours());
  const [pickerMinute, setPickerMinute] = useState(new Date().getMinutes());

  const [customName, setCustomName] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customServing, setCustomServing] = useState("");
  const [customCals, setCustomCals] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");

  const resetCustomForm = () => {
    setCustomName(""); setCustomBrand(""); setCustomServing("");
    setCustomCals(""); setCustomProtein(""); setCustomCarbs(""); setCustomFat("");
  };

  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      setSearchResults([]);
      setSearchError(null);
      setShowCustomForm(false);
      resetCustomForm();
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  }, [visible]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchQuery.trim();
    if (q.length < 2) { setSearchResults([]); setSearchError(null); return; }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const { data, error: fnError } = await supabase.functions.invoke("food-search", { body: { query: q } });
        if (fnError) throw new Error(fnError.message ?? "Search failed");
        if (data?.error) { setSearchError(data.error); setSearchResults([]); return; }
        setSearchResults((data?.products ?? []).map((p: any) => ({
          id: p.id, name: p.name, brand: p.brand ?? "",
          serving_size: p.serving_size ?? undefined,
          calories: p.nutrition.calories, protein_g: p.nutrition.protein,
          carbs_g: p.nutrition.carbs, fat_g: p.nutrition.fat,
        })));
        if (data?.products?.length === 0) setSearchError("No results found");
      } catch (e: any) {
        console.error("Search failed:", e);
        setSearchError("Search failed. Try again.");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const applyDateTime = () => {
    const newDate = new Date(pickerDate);
    newDate.setHours(pickerHour, pickerMinute, 0, 0);
    store.setStagedDate(newDate);
    setShowDateTimePicker(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  function isFutureTime(date: Date, hour: number, minute: number): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (checkDate > today) return true;
    if (checkDate < today) return false;
    return hour * 60 + minute > now.getHours() * 60 + now.getMinutes();
  }

  const mealTypes: ("breakfast" | "lunch" | "dinner" | "snack")[] = ["breakfast", "lunch", "dinner", "snack"];

  const handleLogMeal = async () => {
    if (store.stagedItems.length === 0) return;
    const es = store.stagedItems.map((item) => ({
      user_id: userId, name: item.name, brand: item.brand ?? null, serving_size: item.serving_size ?? null,
      calories: Math.round(item.calories * item.quantity), protein_g: Math.round(item.protein_g * item.quantity * 10) / 10,
      carbs_g: Math.round(item.carbs_g * item.quantity * 10) / 10, fat_g: Math.round(item.fat_g * item.quantity * 10) / 10,
      meal_type: store.selectedMealType, logged_at: store.stagedDate, session_id: null,
    }));
    try {
      await onLogMeal(es);
      store.clearStaged();
      onClose();
    } catch (err) {
      console.error("Failed to log meals:", err);
    }
  };

  const handleClose = () => {
    store.clearStaged();
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  };

  const handleQuickAddItem = (item: StagedItem) => {
    if (!FOOD_MACROS[item.name]) {
      error(`"${item.name}" isn't available in Quick Add`);
      return;
    }
    if (quickAddFoods.includes(item.name)) {
      success(`"${item.name}" already in Quick Add`);
      return;
    }
    onSaveItemToQuickAdd?.(item.name);
    success(`"${item.name}" added to Quick Add`);
  };

  const handlePickPhoto = async (source: "camera" | "library") => {
    setShowPhotoPicker(false);
    if (source === "camera") {
      setShowFoodCamera(true);
      return;
    }
    try {
      const { launchImageLibraryAsync } = await import("expo-image-picker");
      const result = await launchImageLibraryAsync({
        mediaTypes: ["images"],
        base64: true,
        quality: 0.6,
      });
      if (!result.canceled && result.assets?.[0]?.base64) {
        setSearchLoading(true);
        const { data } = await supabase.functions.invoke("food-photo", {
          body: { image: result.assets[0].base64 },
        });
        if (data?.products) {
          data.products.forEach((p: any) => {
            store.addItem({ name: p.name, brand: p.brand ?? "", serving_size: p.serving_size ?? undefined, calories: p.nutrition.calories, protein_g: p.nutrition.protein ?? 0, carbs_g: p.nutrition.carbs ?? 0, fat_g: p.nutrition.fat ?? 0, quantity: 1 });
          });
        }
      }
    } catch (e: any) {
      console.error("Photo picker error:", e?.message ?? e);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
        <Toast visible={toast.visible} message={toast.message} type={toast.type} />
        {/* Fixed Header */}
        <View className="flex-row justify-between items-center px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 22 }}>Log Meal</Text>
          <Pressable onPress={handleClose} className="p-1">
            <MaterialCommunityIcons name="close" size={26} color={c.textMuted} />
          </Pressable>
        </View>

        {/* Fixed Search Bar */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: searchQuery.length >= 2 ? 8 : 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TextInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search food..."
              placeholderTextColor={c.placeholder}
              className="flex-1 rounded-xl px-4 py-4"
              style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 16 }}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            <Pressable
              onPress={() => setShowBarcodeScanner(true)}
              style={{ borderRadius: 12, backgroundColor: c.inputBg, padding: 14, justifyContent: "center" }}
            >
              <MaterialCommunityIcons name="barcode-scan" size={24} color={accent.lime} />
            </Pressable>
            <Pressable
              onPress={() => setShowPhotoPicker(true)}
              style={{ borderRadius: 12, backgroundColor: c.inputBg, padding: 14, justifyContent: "center" }}
            >
              <MaterialCommunityIcons name="camera" size={24} color={accent.cyan} />
            </Pressable>
          </View>
        </View>

        {/* Fixed Search Results */}
        {searchQuery.trim().length >= 2 && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 8, maxHeight: 240, minHeight: 40 }}>
            <View style={{ borderRadius: 12, backgroundColor: c.cardBgAlt, padding: 10 }}>
              {searchLoading ? (
                <ActivityIndicator color={accent.lime} />
              ) : searchError ? (
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingVertical: 8 }}>
                  {searchError}
                </Text>
              ) : searchResults.length > 0 ? (
                <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled style={{ maxHeight: 200 }}>
                  {searchResults.map((item: any) => (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        store.addItem({ name: item.name, brand: item.brand, calories: item.calories, protein_g: item.protein_g, carbs_g: item.carbs_g, fat_g: item.fat_g, quantity: 1 });
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      style={{ borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 4, backgroundColor: c.elevated }}
                    >
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 15 }}>{item.name}</Text>
                      {item.brand ? (
                        <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>{item.brand}</Text>
                      ) : null}
                      <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }}>
                        {item.calories} kcal · P{item.protein_g}g · C{item.carbs_g}g · F{item.fat_g}g
                        {item.serving_size ? ` · ${item.serving_size}` : ""}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingVertical: 8 }}>
                  No results
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Scrollable Content */}
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Meal Type Selector */}
            <View className="flex-row gap-2 mb-5">
              {mealTypes.map((type) => {
                const isActive = store.selectedMealType === type;
                const color = mealColors[type];
                return (
                  <Pressable
                    key={type}
                    onPress={() => store.setSelectedMealType(type)}
                    className="flex-1 py-3 rounded-lg items-center"
                    style={{ backgroundColor: isActive ? color : c.buttonBg }}
                  >
                    <Text style={{
                      color: isActive ? (color === mealColors.breakfast || color === mealColors.lunch ? c.textOnAccent : "#FFFFFF") : c.textMuted,
                      fontFamily: isActive ? "Inter_700Bold" : "Inter_400Regular",
                      fontSize: 13,
                      textTransform: "capitalize",
                    }}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Staged items count badge */}
            {store.stagedItems.length > 0 && (
              <View className="flex-row items-center mb-4 gap-2">
                <View className="rounded-full px-3 py-1" style={{ backgroundColor: accent.limeBg }}>
                  <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                    {store.stagedItems.length} {store.stagedItems.length === 1 ? "item" : "items"} staged
                  </Text>
                </View>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                  — scroll down to review
                </Text>
              </View>
            )}

            {/* Date/Time */}
            <Pressable
              onPress={() => { const d = new Date(store.stagedDate); setPickerDate(d); setPickerHour(d.getHours()); setPickerMinute(d.getMinutes()); setShowDateTimePicker(true); }}
              className="rounded-xl px-5 py-4 mb-5 flex-row items-center justify-between"
              style={{ backgroundColor: c.cardBgAlt }}
            >
              <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 15 }}>{formatDateTime(new Date(store.stagedDate))}</Text>
              <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold", fontSize: 14 }}>Change</Text>
            </Pressable>

            {/* My Meals */}
            {myMeals.length > 0 && (
              <View className="mb-5">
                <View className="flex-row justify-between items-center mb-3">
                  <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>
                    MY MEALS
                  </Text>
                  <Pressable onPress={() => setShowMyMealsManager(true)}>
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={c.textMuted} />
                  </Pressable>
                </View>
                <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
                  {myMeals.slice(0, 6).map((meal) => {
                    const totalCals = meal.items.reduce((s, i) => s + i.calories, 0);
                    const previewNames = meal.items.slice(0, 2).map((i) => i.name).join(", ");
                    const overflow = meal.items.length > 2 ? ` +${meal.items.length - 2} more` : "";
                    return (
                      <Pressable
                        key={meal.id}
                        className="w-1/2"
                        style={{ paddingHorizontal: 6, marginBottom: 12 }}
                        onPress={() => {
                          meal.items.forEach((item) => {
                            store.addItem({ name: item.name, brand: item.brand ?? "", serving_size: item.serving_size ?? undefined, calories: item.calories, protein_g: item.protein_g ?? 0, carbs_g: item.carbs_g ?? 0, fat_g: item.fat_g ?? 0, quantity: 1 });
                          });
                          onBumpMyMealUsage?.(meal.id);
                        }}
                      >
                        <View className="rounded-xl p-4" style={{ backgroundColor: c.cardBgAlt }}>
                          <View className="flex-row items-center gap-2 mb-1">
                            <View className="rounded-lg items-center justify-center" style={{ width: 28, height: 28, backgroundColor: accent.cyanBg }}>
                              <MaterialCommunityIcons name="bookmark-outline" size={14} color={accent.cyan} />
                            </View>
                            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 13, flex: 1 }} numberOfLines={1}>{meal.name}</Text>
                          </View>
                          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, marginBottom: 1 }}>{totalCals} KCAL · {meal.items.length} {meal.items.length === 1 ? "item" : "items"}</Text>
                          {previewNames && (
                            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 11 }} numberOfLines={1}>
                              {previewNames}{overflow}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Quick-Add Favorites */}
            <View className="mb-5">
              <View className="flex-row justify-between items-center mb-3">
                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>
                  QUICK ADD
                </Text>
                <Pressable onPress={() => setShowEditQuickAdd(true)}>
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={c.textMuted} />
                </Pressable>
              </View>
              <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
                {quickAddFoods.map((foodName) => {
                  const macros = FOOD_MACROS[foodName];
                  if (!macros) return null;
                  return (
                    <Pressable
                      key={foodName}
                      className="w-1/2"
                      style={{ paddingHorizontal: 6, marginBottom: 12 }}
                      onPress={() => {
                        store.addItem({ name: foodName, brand: "", calories: macros.cals, protein_g: macros.p, carbs_g: macros.c, fat_g: macros.f, quantity: 1 });
                      }}
                    >
                      <View className="rounded-xl p-4 flex-row items-center gap-3" style={{ backgroundColor: c.cardBgAlt }}>
                        <View className="rounded-lg items-center justify-center" style={{ width: 36, height: 36, backgroundColor: accent.limeBg }}>
                          <MaterialCommunityIcons name="food-apple-outline" size={18} color={accent.lime} />
                        </View>
                        <View className="flex-1">
                          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }} numberOfLines={1}>{foodName}</Text>
                          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10 }}>{macros.cals} KCAL</Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Recent Foods */}
            {recentFoods.length > 0 && (
              <View className="mb-5">
                <View className="flex-row items-center mb-3">
                  <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>
                    RECENT
                  </Text>
                </View>
                <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
                  {recentFoods.map((item) => (
                    <Pressable
                      key={item.name}
                      className="w-1/2"
                      style={{ paddingHorizontal: 6, marginBottom: 12 }}
                      onPress={() => {
                        store.addItem({ name: item.name, brand: item.brand ?? "", serving_size: item.serving_size ?? undefined, calories: item.calories, protein_g: item.protein_g ?? 0, carbs_g: item.carbs_g ?? 0, fat_g: item.fat_g ?? 0, quantity: 1 });
                      }}
                    >
                      <View className="rounded-xl p-4 flex-row items-center gap-3" style={{ backgroundColor: c.cardBgAlt }}>
                        <View className="rounded-lg items-center justify-center" style={{ width: 36, height: 36, backgroundColor: accent.limeBg }}>
                          <MaterialCommunityIcons name="history" size={18} color={accent.lime} />
                        </View>
                        <View className="flex-1">
                          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }} numberOfLines={1}>{item.name}</Text>
                          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10 }}>{item.calories} KCAL</Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Add Custom Item */}
            {!showCustomForm ? (
              <Pressable
                onPress={() => setShowCustomForm(true)}
                className="rounded-xl py-3 mb-5 items-center"
                style={{ backgroundColor: c.cardBgAlt }}
              >
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 15 }}>+ Add Custom Item</Text>
              </Pressable>
            ) : (
              <View className="rounded-xl p-5 mb-5" style={{ backgroundColor: c.cardBgAlt }}>
                <View className="flex-row justify-between items-center mb-4">
                  <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 16 }}>Custom Item</Text>
                  <Pressable onPress={() => { setShowCustomForm(false); resetCustomForm(); }}>
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14 }}>Cancel</Text>
                  </Pressable>
                </View>
                <TextInput
                  placeholder="Name *"
                  placeholderTextColor={c.placeholder}
                  value={customName}
                  onChangeText={setCustomName}
                  className="rounded-xl px-4 py-3 mb-2"
                  style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 15 }}
                />
                <TextInput
                  placeholder="Brand"
                  placeholderTextColor={c.placeholder}
                  value={customBrand}
                  onChangeText={setCustomBrand}
                  className="rounded-xl px-4 py-3 mb-2"
                  style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 15 }}
                />
                <TextInput
                  placeholder="Serving size (e.g. 100g, 1 cup)"
                  placeholderTextColor={c.placeholder}
                  value={customServing}
                  onChangeText={setCustomServing}
                  className="rounded-xl px-4 py-3 mb-4"
                  style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 15 }}
                />
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 4 }}>CALORIES *</Text>
                    <View className="flex-row items-center gap-2 rounded-xl px-3" style={{ backgroundColor: c.inputBg }}>
                      <Pressable onPress={() => setCustomCals(String(Math.max(0, (parseInt(customCals) || 0) - 50)))} className="p-2">
                        <MaterialCommunityIcons name="minus" size={18} color={c.text} />
                      </Pressable>
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 17, flex: 1, textAlign: "center" }}>
                        {parseInt(customCals) || 0}
                      </Text>
                      <Pressable onPress={() => setCustomCals(String((parseInt(customCals) || 0) + 50))} className="p-2">
                        <MaterialCommunityIcons name="plus" size={18} color={c.text} />
                      </Pressable>
                    </View>
                    <View className="flex-row gap-1 mt-1">
                      {[100, 200, 300, 500].map((v) => (
                        <Pressable key={v} onPress={() => setCustomCals(String(v))}
                          className="flex-1 py-1.5 rounded-md items-center"
                          style={{ backgroundColor: (parseInt(customCals) || 0) === v ? accent.limeBg : c.buttonBg }}>
                          <Text style={{ color: (parseInt(customCals) || 0) === v ? accent.lime : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 12 }}>{v}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 4 }}>PROTEIN (g)</Text>
                    <View className="flex-row items-center gap-2 rounded-xl px-3" style={{ backgroundColor: c.inputBg }}>
                      <Pressable onPress={() => setCustomProtein(String(Math.max(0, (parseFloat(customProtein) || 0) - 5)))} className="p-2">
                        <MaterialCommunityIcons name="minus" size={18} color={c.text} />
                      </Pressable>
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 17, flex: 1, textAlign: "center" }}>
                        {parseFloat(customProtein) || 0}
                      </Text>
                      <Pressable onPress={() => setCustomProtein(String((parseFloat(customProtein) || 0) + 5))} className="p-2">
                        <MaterialCommunityIcons name="plus" size={18} color={c.text} />
                      </Pressable>
                    </View>
                    <View className="flex-row gap-1 mt-1">
                      {[10, 20, 30, 50].map((v) => (
                        <Pressable key={v} onPress={() => setCustomProtein(String(v))}
                          className="flex-1 py-1.5 rounded-md items-center"
                          style={{ backgroundColor: (parseFloat(customProtein) || 0) === v ? accent.limeBg : c.buttonBg }}>
                          <Text style={{ color: (parseFloat(customProtein) || 0) === v ? accent.lime : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 12 }}>{v}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
                <View className="flex-row gap-3 mb-5">
                  <View className="flex-1">
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 4 }}>CARBS (g)</Text>
                    <View className="flex-row items-center gap-2 rounded-xl px-3" style={{ backgroundColor: c.inputBg }}>
                      <Pressable onPress={() => setCustomCarbs(String(Math.max(0, (parseFloat(customCarbs) || 0) - 5)))} className="p-2">
                        <MaterialCommunityIcons name="minus" size={18} color={c.text} />
                      </Pressable>
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 17, flex: 1, textAlign: "center" }}>
                        {parseFloat(customCarbs) || 0}
                      </Text>
                      <Pressable onPress={() => setCustomCarbs(String((parseFloat(customCarbs) || 0) + 5))} className="p-2">
                        <MaterialCommunityIcons name="plus" size={18} color={c.text} />
                      </Pressable>
                    </View>
                    <View className="flex-row gap-1 mt-1">
                      {[10, 20, 30, 50].map((v) => (
                        <Pressable key={v} onPress={() => setCustomCarbs(String(v))}
                          className="flex-1 py-1.5 rounded-md items-center"
                          style={{ backgroundColor: (parseFloat(customCarbs) || 0) === v ? accent.limeBg : c.buttonBg }}>
                          <Text style={{ color: (parseFloat(customCarbs) || 0) === v ? accent.lime : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 12 }}>{v}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 4 }}>FAT (g)</Text>
                    <View className="flex-row items-center gap-2 rounded-xl px-3" style={{ backgroundColor: c.inputBg }}>
                      <Pressable onPress={() => setCustomFat(String(Math.max(0, (parseFloat(customFat) || 0) - 5)))} className="p-2">
                        <MaterialCommunityIcons name="minus" size={18} color={c.text} />
                      </Pressable>
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 17, flex: 1, textAlign: "center" }}>
                        {parseFloat(customFat) || 0}
                      </Text>
                      <Pressable onPress={() => setCustomFat(String((parseFloat(customFat) || 0) + 5))} className="p-2">
                        <MaterialCommunityIcons name="plus" size={18} color={c.text} />
                      </Pressable>
                    </View>
                    <View className="flex-row gap-1 mt-1">
                      {[10, 20, 30, 50].map((v) => (
                        <Pressable key={v} onPress={() => setCustomFat(String(v))}
                          className="flex-1 py-1.5 rounded-md items-center"
                          style={{ backgroundColor: (parseFloat(customFat) || 0) === v ? accent.limeBg : c.buttonBg }}>
                          <Text style={{ color: (parseFloat(customFat) || 0) === v ? accent.lime : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 12 }}>{v}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    const cals = parseInt(customCals, 10);
                    if (!customName.trim() || isNaN(cals)) return;
                    store.addItem({
                      name: customName.trim(), brand: customBrand.trim(),
                      serving_size: customServing.trim() || undefined,
                      calories: cals,
                      protein_g: parseFloat(customProtein) || 0,
                      carbs_g: parseFloat(customCarbs) || 0,
                      fat_g: parseFloat(customFat) || 0,
                      quantity: 1,
                    });
                    resetCustomForm();
                    setShowCustomForm(false);
                  }}
                  className="rounded-xl py-3 items-center"
                  style={{ backgroundColor: accent.lime, opacity: (!customName.trim() || !customCals) ? 0.5 : 1 }}
                >
                  <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold", fontSize: 16 }}>Add to Meal</Text>
                </Pressable>
              </View>
            )}

            {/* Meal Builder */}
            <View className="mb-2">
              <MealBuilder items={store.stagedItems} mealType={store.selectedMealType} onRemove={store.removeItem} onEdit={setEditingItem} onLog={handleLogMeal} onSaveAsMeal={onSaveAsMeal && store.stagedItems.length > 0 ? () => setShowSaveAsMeal(true) : undefined} onSaveItemToQuickAdd={onSaveItemToQuickAdd && store.stagedItems.length > 0 ? handleQuickAddItem : undefined} />
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Sub-modals */}
      <EditQuickAddModal visible={showEditQuickAdd} selectedFoods={quickAddFoods} onSave={onSaveQuickAdd} onClose={() => setShowEditQuickAdd(false)} />

      <MyMealsManagerModal visible={showMyMealsManager} userId={userId} onClose={() => setShowMyMealsManager(false)} />

      <BarcodeScanner
        visible={showBarcodeScanner}
        onProductFound={(item) => {
          setShowBarcodeScanner(false);
          store.addItem({ name: item.name, brand: item.brand, calories: item.calories, protein_g: item.protein_g ?? 0, carbs_g: item.carbs_g ?? 0, fat_g: item.fat_g ?? 0, quantity: 1 });
        }}
        onClose={() => setShowBarcodeScanner(false)}
      />

      <FoodCamera
        visible={showFoodCamera}
        onProductsFound={(products) => {
          setShowFoodCamera(false);
          products.forEach((p: any) => {
            store.addItem({ name: p.name, brand: p.brand ?? "", serving_size: p.serving_size ?? undefined, calories: p.nutrition.calories, protein_g: p.nutrition.protein ?? 0, carbs_g: p.nutrition.carbs ?? 0, fat_g: p.nutrition.fat ?? 0, quantity: 1 });
          });
        }}
        onClose={() => setShowFoodCamera(false)}
      />

      {/* Date/Time Picker */}
      <Modal visible={showDateTimePicker} transparent animationType="slide" onRequestClose={() => setShowDateTimePicker(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowDateTimePicker(false)}>
          <Pressable className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }} onStartShouldSetResponder={() => true}>
            <View className="flex-row justify-between items-center mb-4">
              <Pressable onPress={() => setShowDateTimePicker(false)}>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15 }}>Cancel</Text>
              </Pressable>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20 }}>Select Time</Text>
              <Pressable onPress={applyDateTime}>
                <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold", fontSize: 15 }}>Done</Text>
              </Pressable>
            </View>
            <View className="flex-row justify-center gap-6 mb-6">
              <View className="items-center">
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 8 }}>Hour</Text>
                <ScrollView className="h-32 w-20" showsVerticalScrollIndicator={false}>
                  {hours.map((h) => {
                    const isDisabled = isFutureTime(pickerDate, h, pickerMinute);
                    return (
                      <Pressable key={h} onPress={() => !isDisabled && setPickerHour(h)} disabled={isDisabled}
                        className="py-2 items-center rounded-lg"
                        style={{ backgroundColor: pickerHour === h ? accent.limeBg : "transparent", opacity: isDisabled ? 0.3 : 1 }}>
                        <Text className="text-xl"
                          style={{ color: pickerHour === h ? accent.lime : c.textMuted, fontFamily: pickerHour === h ? "Inter_700Bold" : "Inter_400Regular" }}>
                          {h.toString().padStart(2, "0")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 24, marginTop: 24 }}>:</Text>
              <View className="items-center">
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 8 }}>Minute</Text>
                <ScrollView className="h-32 w-20" showsVerticalScrollIndicator={false}>
                  {minutes.map((m) => {
                    const isDisabled = isFutureTime(pickerDate, pickerHour, m);
                    return (
                      <Pressable key={m} onPress={() => !isDisabled && setPickerMinute(m)} disabled={isDisabled}
                        className="py-2 items-center rounded-lg"
                        style={{ backgroundColor: pickerMinute === m ? accent.limeBg : "transparent", opacity: isDisabled ? 0.3 : 1 }}>
                        <Text className="text-xl"
                          style={{ color: pickerMinute === m ? accent.lime : c.textMuted, fontFamily: pickerMinute === m ? "Inter_700Bold" : "Inter_400Regular" }}>
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
                <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 15 }}>Yesterday</Text>
              </Pressable>
              <Pressable onPress={() => setPickerDate(new Date())} className="rounded-lg px-4 py-2" style={{ backgroundColor: c.buttonBg }}>
                <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 15 }}>Today</Text>
              </Pressable>
            </View>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center" }}>
              {pickerDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Photo Picker Modal */}
      <Modal visible={showPhotoPicker} transparent animationType="slide" onRequestClose={() => setShowPhotoPicker(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowPhotoPicker(false)}>
          <Pressable className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }} onStartShouldSetResponder={() => true}>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 16 }}>Add Food Photo</Text>
            <Pressable onPress={() => handlePickPhoto("camera")} className="flex-row items-center gap-3 py-4 rounded-xl px-4 mb-2" style={{ backgroundColor: c.buttonBg }}>
              <MaterialCommunityIcons name="camera" size={24} color={accent.cyan} />
              <View>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 15 }}>Take Photo</Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>Use your camera to capture a meal</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => handlePickPhoto("library")} className="flex-row items-center gap-3 py-4 rounded-xl px-4 mb-4" style={{ backgroundColor: c.buttonBg }}>
              <MaterialCommunityIcons name="image-multiple-outline" size={24} color={accent.lime} />
              <View>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 15 }}>Choose from Library</Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>Pick a photo from your gallery</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => setShowPhotoPicker(false)} className="py-3 items-center" style={{ backgroundColor: c.buttonBg }}>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15 }}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Save as Meal Prompt */}
      <Modal visible={showSaveAsMeal} transparent animationType="fade" onRequestClose={() => setShowSaveAsMeal(false)}>
        <Pressable className="flex-1 justify-center items-center" style={{ backgroundColor: c.overlay }} onPress={() => setShowSaveAsMeal(false)}>
          <Pressable onStartShouldSetResponder={() => true} className="rounded-2xl p-6 w-80" style={{ backgroundColor: c.elevated }}>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 4 }}>Save as Meal</Text>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 16 }}>
              {store.stagedItems.length} {store.stagedItems.length === 1 ? "item" : "items"} will be saved as a reusable meal template.
            </Text>
            <TextInput
              value={saveAsMealName}
              onChangeText={setSaveAsMealName}
              placeholder="e.g. Pre-Workout Meal"
              placeholderTextColor={c.placeholder}
              className="rounded-xl px-4 py-3 mb-4"
              style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 15 }}
              autoFocus
            />
            <View className="flex-row gap-3">
              <Pressable onPress={() => setShowSaveAsMeal(false)} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: c.buttonBg }}>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15 }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={async () => {
                if (!saveAsMealName.trim()) return;
                const items = store.stagedItems.map((item) => ({
                  name: item.name,
                  brand: item.brand ?? null,
                  serving_size: item.serving_size ?? null,
                  calories: item.calories,
                  protein_g: item.protein_g,
                  carbs_g: item.carbs_g,
                  fat_g: item.fat_g,
                }));
                await onSaveAsMeal?.(saveAsMealName.trim(), items);
                setShowSaveAsMeal(false);
                setSaveAsMealName("");
                success("Meal saved!");
              }} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: accent.lime, opacity: saveAsMealName.trim() ? 1 : 0.5 }} disabled={!saveAsMealName.trim()}>
                <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold", fontSize: 15 }}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Staged Item Modal */}
      <Modal visible={!!editingItem} transparent animationType="slide" onRequestClose={() => setEditingItem(null)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setEditingItem(null)}>
          <Pressable className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }} onStartShouldSetResponder={() => true}>
            <View className="flex-row justify-between items-center mb-4">
              <Pressable onPress={() => setEditingItem(null)}>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15 }}>Cancel</Text>
              </Pressable>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20 }}>Edit Item</Text>
              <View className="w-14" />
            </View>

            {editingItem && (
              <>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center", marginBottom: 6 }}>{editingItem.name}</Text>
                {editingItem.brand ? (
                  <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginBottom: 20 }}>{editingItem.brand}</Text>
                ) : null}

                <View className="flex-row items-center justify-center gap-4 mb-5">
                  <Pressable onPress={() => setEQty(Math.max(0.5, eQty - 0.5))} className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: c.buttonBg }}>
                    <MaterialCommunityIcons name="minus" size={22} color={c.text} />
                  </Pressable>
                  <View className="items-center">
                    <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 32, minWidth: 50, textAlign: "center" }}>{eQty}</Text>
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 11 }}>SERVINGS</Text>
                  </View>
                  <Pressable onPress={() => setEQty(eQty + 0.5)} className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: c.buttonBg }}>
                    <MaterialCommunityIcons name="plus" size={22} color={c.text} />
                  </Pressable>
                </View>

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
                            style={{ backgroundColor: macro.val === v ? accent.limeBg : c.buttonBg }}>
                            <Text style={{ color: macro.val === v ? accent.lime : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 12 }}>{v}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>

                <View className="rounded-xl p-3 mb-5" style={{ backgroundColor: accent.limeBg }}>
                  <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold", fontSize: 15, textAlign: "center" }}>
                    Total: {Math.round(eCals * eQty)} kcal
                  </Text>
                </View>

                <Pressable onPress={() => { store.updateItem(editingItem.id, { quantity: eQty, calories: eCals, protein_g: eProtein, carbs_g: eCarbs, fat_g: eFat }); setEditingItem(null); }} className="rounded-xl py-3.5 items-center" style={{ backgroundColor: accent.lime }}>
                  <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold", fontSize: 16 }}>Save Changes</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}
