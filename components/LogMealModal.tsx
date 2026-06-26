import React, { useState, useRef, useEffect } from "react";
import { Pressable, View, Text, TextInput, ScrollView, Modal, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, MEAL_COLORS } from "@/lib/theme-colors";
import { useFoodLogStore } from "@/store/useFoodLogStore";
import { MealBuilder } from "@/components/MealBuilder";
import { QuantityModal } from "@/components/QuantityModal";
import { EditQuickAddModal } from "@/components/EditQuickAddModal";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { CustomKeyboard } from "@/components/CustomKeyboard";

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

type LogMealModalProps = {
  visible: boolean;
  onClose: () => void;
  userId: string;
  quickAddFoods: string[];
  onSaveQuickAdd: (foods: string[]) => void;
  onLogMeal: (entries: {
    user_id: string; name: string; brand: string | null; serving_size: string | null;
    calories: number; protein_g: number; carbs_g: number; fat_g: number;
    meal_type: string; logged_at: string; session_id: null;
  }[]) => Promise<void>;
};

export function LogMealModal({ visible, onClose, userId, quickAddFoods, onSaveQuickAdd, onLogMeal }: LogMealModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const insets = useSafeAreaInsets();
  const store = useFoodLogStore();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<any>(undefined);
  const [showKeyboard, setShowKeyboard] = useState(false);

  // Sub-modals
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showEditQuickAdd, setShowEditQuickAdd] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [pickerHour, setPickerHour] = useState(new Date().getHours());
  const [pickerMinute, setPickerMinute] = useState(new Date().getMinutes());

  const pendingItemRef = useRef<{ name: string; brand: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; serving_size?: string } | null>(null);

  // Inline custom form state
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

  // Reset state on open
  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      setSearchResults([]);
      setSearchError(null);
      setShowCustomForm(false);
      setShowKeyboard(false);
      resetCustomForm();
    }
  }, [visible]);

  // Debounced search
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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
        {/* Fixed Header */}
        <View className="flex-row justify-between items-center px-5 py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20 }}>Log Meal</Text>
          <Pressable onPress={handleClose} className="p-1">
            <MaterialCommunityIcons name="close" size={24} color={c.textMuted} />
          </Pressable>
        </View>

        {/* Fixed Search Bar */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: searchQuery.length >= 2 ? 8 : 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              onPress={() => setShowKeyboard(true)}
              style={{ flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 12, backgroundColor: c.inputBg, paddingHorizontal: 12, paddingVertical: 12 }}
            >
              <MaterialCommunityIcons name="magnify" size={18} color={c.textMuted} />
              {searchQuery.length > 0 ? (
                <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 14, flex: 1, marginLeft: 8 }} numberOfLines={1}>
                  {searchQuery}
                </Text>
              ) : (
                <Text style={{ color: c.placeholder, fontFamily: "Inter_400Regular", fontSize: 14, flex: 1, marginLeft: 8 }}>
                  Search food...
                </Text>
              )}
              {searchQuery.length > 0 && (
                <Pressable onPress={() => { setSearchQuery(""); setSearchResults([]); }} hitSlop={8}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={c.textMuted} />
                </Pressable>
              )}
            </Pressable>
            <Pressable
              onPress={() => setShowBarcodeScanner(true)}
              style={{ borderRadius: 12, backgroundColor: c.inputBg, paddingHorizontal: 12, paddingVertical: 12, justifyContent: "center" }}
            >
              <MaterialCommunityIcons name="barcode-scan" size={22} color={ACCENT.lime} />
            </Pressable>
          </View>
        </View>

        {/* Fixed Search Results */}
        {searchQuery.trim().length >= 2 && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 8, maxHeight: 200, minHeight: 40 }}>
            <View style={{ borderRadius: 12, backgroundColor: c.cardBgAlt, padding: 10 }}>
              {searchLoading ? (
                <ActivityIndicator color={ACCENT.lime} />
              ) : searchError ? (
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", paddingVertical: 6 }}>
                  {searchError}
                </Text>
              ) : searchResults.length > 0 ? (
                <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled
                  style={{ maxHeight: 170 }}>
                  {searchResults.map((item: any) => (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        setShowKeyboard(false);
                        pendingItemRef.current = item;
                        setShowQuantityModal(true);
                      }}
                      style={{ borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 4, backgroundColor: c.elevated }}
                    >
                      <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 13 }}>{item.name}</Text>
                      {item.brand ? (
                        <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 10 }}>{item.brand}</Text>
                      ) : null}
                      <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 1 }}>
                        {item.calories} kcal · P{item.protein_g}g · C{item.carbs_g}g · F{item.fat_g}g
                        {item.serving_size ? ` · ${item.serving_size}` : ""}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", paddingVertical: 6 }}>
                  No results
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Content area with dimming */}
        <View style={{ flex: 1, overflow: "hidden" }}>
          {showKeyboard && (
            <Pressable
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 5 }}
              onPress={() => setShowKeyboard(false)}
            />
          )}
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={true}
            style={{ opacity: showKeyboard ? 0.15 : 1 }}
            pointerEvents={showKeyboard ? "none" : "auto"}
          >
            {/* Meal Type Selector */}
            <View className="flex-row gap-2 mb-4">
              {mealTypes.map((type) => {
                const isActive = store.selectedMealType === type;
                const color = MEAL_COLORS[type];
                return (
                  <Pressable
                    key={type}
                    onPress={() => store.setSelectedMealType(type)}
                    className="flex-1 py-2.5 rounded-lg items-center"
                    style={{ backgroundColor: isActive ? color : c.buttonBg }}
                  >
                    <Text style={{
                      color: isActive ? (color === MEAL_COLORS.breakfast || color === MEAL_COLORS.lunch ? "#161e00" : "#FFFFFF") : c.textMuted,
                      fontFamily: isActive ? "Inter_700Bold" : "Inter_400Regular",
                      fontSize: 10,
                      textTransform: "capitalize",
                    }}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Date/Time */}
            <Pressable
              onPress={() => { const d = new Date(store.stagedDate); setPickerDate(d); setPickerHour(d.getHours()); setPickerMinute(d.getMinutes()); setShowDateTimePicker(true); }}
              className="rounded-xl px-4 py-3 mb-4 flex-row items-center justify-between"
              style={{ backgroundColor: c.cardBgAlt }}
            >
              <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 13 }}>{formatDateTime(new Date(store.stagedDate))}</Text>
              <Text style={{ color: ACCENT.lime, fontFamily: "Inter_700Bold", fontSize: 12 }}>Change</Text>
            </Pressable>

            {/* Quick-Add Favorites */}
            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
                  QUICK ADD
                </Text>
                <Pressable onPress={() => setShowEditQuickAdd(true)}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color={c.textMuted} />
                </Pressable>
              </View>
              <View className="flex-row flex-wrap" style={{ marginHorizontal: -5 }}>
                {quickAddFoods.map((foodName) => {
                  const macros = FOOD_MACROS[foodName];
                  if (!macros) return null;
                  return (
                    <Pressable
                      key={foodName}
                      className="w-1/2"
                      style={{ paddingHorizontal: 5, marginBottom: 10 }}
                      onPress={() => {
                        store.addItem({ name: foodName, brand: "", calories: macros.cals, protein_g: macros.p, carbs_g: macros.c, fat_g: macros.f, quantity: 1 });
                      }}
                    >
                      <View className="rounded-xl p-3 flex-row items-center gap-2.5" style={{ backgroundColor: c.cardBgAlt }}>
                        <View className="rounded-lg items-center justify-center" style={{ width: 32, height: 32, backgroundColor: ACCENT.limeBg }}>
                          <MaterialCommunityIcons name="food-apple-outline" size={16} color={ACCENT.lime} />
                        </View>
                        <View className="flex-1">
                          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 12 }} numberOfLines={1}>{foodName}</Text>
                          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 8 }}>{macros.cals} KCAL</Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Add Custom Item — inline form */}
            {!showCustomForm ? (
              <Pressable
                onPress={() => setShowCustomForm(true)}
                className="rounded-xl py-2.5 mb-4 items-center"
                style={{ backgroundColor: c.cardBgAlt }}
              >
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 13 }}>+ Add Custom Item</Text>
              </Pressable>
            ) : (
              <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: c.cardBgAlt }}>
                <View className="flex-row justify-between items-center mb-3">
                  <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>Custom Item</Text>
                  <Pressable onPress={() => { setShowCustomForm(false); resetCustomForm(); }}>
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 13 }}>Cancel</Text>
                  </Pressable>
                </View>
                <TextInput
                  placeholder="Name *"
                  placeholderTextColor={c.placeholder}
                  value={customName}
                  onChangeText={setCustomName}
                  className="rounded-xl px-3 py-2.5 mb-2"
                  style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 13 }}
                />
                <TextInput
                  placeholder="Brand"
                  placeholderTextColor={c.placeholder}
                  value={customBrand}
                  onChangeText={setCustomBrand}
                  className="rounded-xl px-3 py-2.5 mb-2"
                  style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 13 }}
                />
                <TextInput
                  placeholder="Serving size (e.g. 100g, 1 cup)"
                  placeholderTextColor={c.placeholder}
                  value={customServing}
                  onChangeText={setCustomServing}
                  className="rounded-xl px-3 py-2.5 mb-3"
                  style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 13 }}
                />
                <View className="flex-row gap-2 mb-3">
                  <View className="flex-1">
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 10, marginBottom: 3 }}>CALORIES *</Text>
                    <View className="flex-row items-center gap-2 rounded-xl px-2" style={{ backgroundColor: c.inputBg }}>
                      <Pressable onPress={() => setCustomCals(String(Math.max(0, (parseInt(customCals) || 0) - 50)))} className="p-1">
                        <MaterialCommunityIcons name="minus" size={16} color={c.text} />
                      </Pressable>
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 15, flex: 1, textAlign: "center" }}>
                        {parseInt(customCals) || 0}
                      </Text>
                      <Pressable onPress={() => setCustomCals(String((parseInt(customCals) || 0) + 50))} className="p-1">
                        <MaterialCommunityIcons name="plus" size={16} color={c.text} />
                      </Pressable>
                    </View>
                    <View className="flex-row gap-1 mt-1">
                      {[100, 200, 300, 500].map((v) => (
                        <Pressable key={v} onPress={() => setCustomCals(String(v))}
                          className="flex-1 py-1 rounded-md items-center"
                          style={{ backgroundColor: (parseInt(customCals) || 0) === v ? ACCENT.limeBg : c.buttonBg }}>
                          <Text style={{ color: (parseInt(customCals) || 0) === v ? ACCENT.lime : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 10 }}>{v}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 10, marginBottom: 3 }}>PROTEIN (g)</Text>
                    <View className="flex-row items-center gap-2 rounded-xl px-2" style={{ backgroundColor: c.inputBg }}>
                      <Pressable onPress={() => setCustomProtein(String(Math.max(0, (parseFloat(customProtein) || 0) - 5)))} className="p-1">
                        <MaterialCommunityIcons name="minus" size={16} color={c.text} />
                      </Pressable>
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 15, flex: 1, textAlign: "center" }}>
                        {parseFloat(customProtein) || 0}
                      </Text>
                      <Pressable onPress={() => setCustomProtein(String((parseFloat(customProtein) || 0) + 5))} className="p-1">
                        <MaterialCommunityIcons name="plus" size={16} color={c.text} />
                      </Pressable>
                    </View>
                    <View className="flex-row gap-1 mt-1">
                      {[10, 20, 30, 50].map((v) => (
                        <Pressable key={v} onPress={() => setCustomProtein(String(v))}
                          className="flex-1 py-1 rounded-md items-center"
                          style={{ backgroundColor: (parseFloat(customProtein) || 0) === v ? ACCENT.limeBg : c.buttonBg }}>
                          <Text style={{ color: (parseFloat(customProtein) || 0) === v ? ACCENT.lime : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 10 }}>{v}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
                <View className="flex-row gap-2 mb-4">
                  <View className="flex-1">
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 10, marginBottom: 3 }}>CARBS (g)</Text>
                    <View className="flex-row items-center gap-2 rounded-xl px-2" style={{ backgroundColor: c.inputBg }}>
                      <Pressable onPress={() => setCustomCarbs(String(Math.max(0, (parseFloat(customCarbs) || 0) - 5)))} className="p-1">
                        <MaterialCommunityIcons name="minus" size={16} color={c.text} />
                      </Pressable>
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 15, flex: 1, textAlign: "center" }}>
                        {parseFloat(customCarbs) || 0}
                      </Text>
                      <Pressable onPress={() => setCustomCarbs(String((parseFloat(customCarbs) || 0) + 5))} className="p-1">
                        <MaterialCommunityIcons name="plus" size={16} color={c.text} />
                      </Pressable>
                    </View>
                    <View className="flex-row gap-1 mt-1">
                      {[10, 20, 30, 50].map((v) => (
                        <Pressable key={v} onPress={() => setCustomCarbs(String(v))}
                          className="flex-1 py-1 rounded-md items-center"
                          style={{ backgroundColor: (parseFloat(customCarbs) || 0) === v ? ACCENT.limeBg : c.buttonBg }}>
                          <Text style={{ color: (parseFloat(customCarbs) || 0) === v ? ACCENT.lime : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 10 }}>{v}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 10, marginBottom: 3 }}>FAT (g)</Text>
                    <View className="flex-row items-center gap-2 rounded-xl px-2" style={{ backgroundColor: c.inputBg }}>
                      <Pressable onPress={() => setCustomFat(String(Math.max(0, (parseFloat(customFat) || 0) - 5)))} className="p-1">
                        <MaterialCommunityIcons name="minus" size={16} color={c.text} />
                      </Pressable>
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 15, flex: 1, textAlign: "center" }}>
                        {parseFloat(customFat) || 0}
                      </Text>
                      <Pressable onPress={() => setCustomFat(String((parseFloat(customFat) || 0) + 5))} className="p-1">
                        <MaterialCommunityIcons name="plus" size={16} color={c.text} />
                      </Pressable>
                    </View>
                    <View className="flex-row gap-1 mt-1">
                      {[10, 20, 30, 50].map((v) => (
                        <Pressable key={v} onPress={() => setCustomFat(String(v))}
                          className="flex-1 py-1 rounded-md items-center"
                          style={{ backgroundColor: (parseFloat(customFat) || 0) === v ? ACCENT.limeBg : c.buttonBg }}>
                          <Text style={{ color: (parseFloat(customFat) || 0) === v ? ACCENT.lime : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 10 }}>{v}</Text>
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
                  style={{ backgroundColor: ACCENT.lime, opacity: (!customName.trim() || !customCals) ? 0.5 : 1 }}
                >
                  <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold", fontSize: 14 }}>Add to Meal</Text>
                </Pressable>
              </View>
            )}

            {/* Meal Builder */}
            <View className="mb-2">
              <MealBuilder items={store.stagedItems} mealType={store.selectedMealType} onRemove={store.removeItem} onLog={handleLogMeal} />
            </View>
          </ScrollView>
        </View>

        {/* Custom Keyboard */}
        {showKeyboard && (
          <CustomKeyboard
            onKeyPress={(key) => setSearchQuery((prev) => prev + key)}
            onBackspace={() => setSearchQuery((prev) => prev.slice(0, -1))}
            onSearch={() => setShowKeyboard(false)}
          />
        )}
      </View>

      {/* Sub-modals */}
      <QuantityModal
        visible={showQuantityModal}
        itemName={pendingItemRef.current?.name ?? ""}
        itemCalories={pendingItemRef.current?.calories ?? 0}
        onConfirm={(q) => {
          const item = pendingItemRef.current;
          if (item) { store.addItem({ ...item, quantity: q }); pendingItemRef.current = null; }
          setShowQuantityModal(false);
        }}
        onCancel={() => { setShowQuantityModal(false); pendingItemRef.current = null; }}
      />

      <EditQuickAddModal visible={showEditQuickAdd} selectedFoods={quickAddFoods} onSave={onSaveQuickAdd} onClose={() => setShowEditQuickAdd(false)} />

      <BarcodeScanner
        visible={showBarcodeScanner}
        onProductFound={(item) => {
          setShowBarcodeScanner(false);
          pendingItemRef.current = item;
          setShowQuantityModal(true);
        }}
        onClose={() => setShowBarcodeScanner(false)}
      />

      {/* Date/Time Picker */}
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
    </Modal>
  );
}
