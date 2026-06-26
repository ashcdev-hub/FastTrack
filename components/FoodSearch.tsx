import React, { useState } from "react";
import { Platform, Pressable, View, Text, TextInput, ScrollView, ActivityIndicator, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { BarcodeScanner } from "@/components/BarcodeScanner";

type FoodSearchResult = {
  id: string;
  name: string;
  brand: string;
  serving_size?: string;
  nutrition: { calories: number; protein: number; carbs: number; fat: number };
};

type FoodSearchProps = {
  onAdd: (item: {
    name: string;
    brand: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    serving_size?: string;
    quantity: number;
  }) => void;
};

const COMMON_FOODS = [
  { name: "Boiled Egg", calories: 78, protein: 6, carbs: 1, fat: 5, serving_size: "1 large egg" },
  { name: "Fried Egg", calories: 90, protein: 6, carbs: 1, fat: 7, serving_size: "1 large egg" },
  { name: "Scrambled Eggs", calories: 140, protein: 10, carbs: 2, fat: 10, serving_size: "2 eggs" },
  { name: "White Rice (cooked)", calories: 205, protein: 4, carbs: 45, fat: 0, serving_size: "1 cup" },
  { name: "Brown Rice (cooked)", calories: 216, protein: 5, carbs: 45, fat: 2, serving_size: "1 cup" },
  { name: "Chicken Breast (cooked)", calories: 165, protein: 31, carbs: 0, fat: 4, serving_size: "100g" },
  { name: "Whole Wheat Bread", calories: 80, protein: 4, carbs: 14, fat: 1, serving_size: "1 slice" },
  { name: "White Bread", calories: 75, protein: 2, carbs: 14, fat: 1, serving_size: "1 slice" },
  { name: "Banana", calories: 105, protein: 1, carbs: 27, fat: 0, serving_size: "1 medium" },
  { name: "Apple", calories: 95, protein: 0, carbs: 25, fat: 0, serving_size: "1 medium" },
  { name: "Greek Yogurt", calories: 100, protein: 17, carbs: 6, fat: 1, serving_size: "170g" },
  { name: "Oatmeal (cooked)", calories: 154, protein: 5, carbs: 27, fat: 3, serving_size: "1 cup" },
];

export function FoodSearch({ onAdd }: FoodSearchProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [showScanner, setShowScanner] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("food-search", {
        body: { query: query.trim() },
      });
      if (error) throw new Error(error.message ?? "Search failed");
      if (data?.error) { setError(data.error); setResults([]); return; }
      const items: FoodSearchResult[] = (data?.products ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand ?? "",
        serving_size: p.serving_size ?? undefined,
        nutrition: { calories: p.nutrition.calories, protein: p.nutrition.protein, carbs: p.nutrition.carbs, fat: p.nutrition.fat },
      }));
      setResults(items);
      if (items.length === 0) setError("No results found. Try 'Add Custom Item' instead.");
    } catch (e: any) {
      console.error("Search failed:", e);
      setError("Search failed. Please try again or use 'Add Custom Item'.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCommonFood = (food: typeof COMMON_FOODS[0]) => {
    onAdd({ name: food.name, brand: "", calories: food.calories, protein_g: food.protein, carbs_g: food.carbs, fat_g: food.fat, serving_size: food.serving_size, quantity: 1 });
  };

  const handleAddToMeal = () => {
    if (!selectedItem) return;
    const qty = Number(quantity) || 1;
    onAdd({ name: selectedItem.name, brand: selectedItem.brand, calories: selectedItem.nutrition.calories, protein_g: selectedItem.nutrition.protein, carbs_g: selectedItem.nutrition.carbs, fat_g: selectedItem.nutrition.fat, serving_size: selectedItem.serving_size, quantity: qty });
    setSelectedItem(null);
    setQuantity("1");
  };

  return (
    <View className="glass-panel p-5">
      <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-lg mb-3">Search Food</Text>
      <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs mb-3">
        Search by name or scan a barcode
      </Text>
      <View className="flex-row gap-2 mb-3">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search OpenFoodFacts..."
          placeholderTextColor={c.placeholder}
          className="flex-1 rounded-xl px-4 py-3"
          style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular" }}
          onSubmitEditing={search}
          returnKeyType="search"
        />
        {Platform.OS !== "web" && (
          <Pressable
            onPress={() => setShowScanner(true)}
            className="rounded-xl px-4 py-3"
            style={{ backgroundColor: c.buttonBg }}
          >
            <MaterialCommunityIcons name="barcode-scan" size={20} color={c.text} />
          </Pressable>
        )}
        <Pressable
          onPress={search}
          disabled={loading}
          className="rounded-xl px-4 py-3"
          style={{ backgroundColor: ACCENT.lime, opacity: loading ? 0.5 : 1 }}
        >
          <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold" }}>Search</Text>
        </Pressable>
      </View>

      {loading && <ActivityIndicator color={ACCENT.lime} />}

      {error && (
        <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: ACCENT.roseBg }}>
          <Text style={{ color: ACCENT.rose, fontFamily: "Inter_400Regular" }} className="text-sm">{error}</Text>
        </View>
      )}

      {results.length > 0 && (
        <View style={{ height: 240 }} className="mb-3">
          <ScrollView showsVerticalScrollIndicator={true}>
            {results.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedItem(item)}
                className="rounded-xl p-3 mb-2"
                style={{ backgroundColor: c.cardBgAlt }}
              >
                <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }}>{item.name}</Text>
                {item.brand ? (
                  <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-xs">{item.brand}</Text>
                ) : null}
                <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mt-1">
                  {item.nutrition.calories} kcal · P{item.nutrition.protein}g · C{item.nutrition.carbs}g · F{item.nutrition.fat}g
                  {item.serving_size ? ` · ${item.serving_size}` : ""}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-xs mb-2 tracking-widest">
        QUICK ADD
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {COMMON_FOODS.map((food) => (
          <Pressable
            key={food.name}
            onPress={() => handleAddCommonFood(food)}
            className="rounded-xl px-4 py-2.5 mr-2"
            style={{ backgroundColor: ACCENT.limeBg, borderWidth: 1, borderColor: ACCENT.limeBorder }}
          >
            <Text style={{ color: ACCENT.lime, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-sm">
              {food.name}
            </Text>
            <Text style={{ color: "rgba(45,212,168,0.6)", fontFamily: "Inter_400Regular" }} className="text-xs">
              {food.calories} kcal
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={selectedItem !== null} transparent animationType="slide" onRequestClose={() => setSelectedItem(null)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setSelectedItem(null)}>
          <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
            <View className="flex-row justify-between items-center mb-4">
              <Pressable onPress={() => setSelectedItem(null)}>
                <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }}>Cancel</Text>
              </Pressable>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-lg">Add to Meal</Text>
              <View className="w-12" />
            </View>

            {selectedItem && (
              <>
                <View className="mb-4">
                  <Text style={{ color: c.text, fontFamily: "Inter_400Regular" }}>{selectedItem.name}</Text>
                  {selectedItem.brand ? (
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-sm">{selectedItem.brand}</Text>
                  ) : null}
                  {selectedItem.serving_size ? (
                    <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mt-1">
                      Per serving: {selectedItem.serving_size}
                    </Text>
                  ) : null}
                </View>

                <View className="glass-panel p-4 mb-4">
                  <View className="flex-row justify-between mb-2">
                    <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-sm">Calories</Text>
                    <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold" }}>
                      {selectedItem.nutrition.calories} kcal
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-sm">Macros</Text>
                    <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-sm">
                      P{selectedItem.nutrition.protein}g · C{selectedItem.nutrition.carbs}g · F{selectedItem.nutrition.fat}g
                    </Text>
                  </View>
                </View>

                <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-2">Quantity (servings)</Text>
                <TextInput
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="1"
                  placeholderTextColor={c.placeholder}
                  keyboardType="numeric"
                  className="rounded-xl px-4 py-3 mb-4"
                  style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular" }}
                />

                <Pressable
                  onPress={handleAddToMeal}
                  className="rounded-xl py-3"
                  style={{ backgroundColor: ACCENT.lime }}
                >
                  <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold" }} className="text-center">
                    Add to Meal
                  </Text>
                </Pressable>
              </>
            )}
        </Pressable>
      </Pressable>
    </Modal>

      {Platform.OS !== "web" && (
        <BarcodeScanner
          visible={showScanner}
          onClose={() => setShowScanner(false)}
          onProductFound={(product) => {
            onAdd({
              name: product.name,
              brand: product.brand,
              calories: product.calories,
              protein_g: product.protein_g,
              carbs_g: product.carbs_g,
              fat_g: product.fat_g,
              serving_size: product.serving_size,
              quantity: 1,
            });
          }}
        />
      )}
    </View>
  );
}
