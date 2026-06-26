import React, { useState } from "react";
import { Pressable, View, Text, TextInput, ScrollView, ActivityIndicator, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";

type FoodItem = {
  id: string;
  name: string;
  brand: string;
  serving_size?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

type SearchFoodModalProps = {
  visible: boolean;
  onSelect: (item: FoodItem) => void;
  onClose: () => void;
};

export function SearchFoodModal({ visible, onSelect, onClose }: SearchFoodModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("food-search", {
        body: { query: query.trim() },
      });
      if (fnError) throw new Error(fnError.message ?? "Search failed");
      if (data?.error) { setError(data.error); setResults([]); return; }
      const items: FoodItem[] = (data?.products ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand ?? "",
        serving_size: p.serving_size ?? undefined,
        calories: p.nutrition.calories,
        protein_g: p.nutrition.protein,
        carbs_g: p.nutrition.carbs,
        fat_g: p.nutrition.fat,
      }));
      setResults(items);
      if (items.length === 0) setError("No results found. Try a different search.");
    } catch (e: any) {
      console.error("Search failed:", e);
      setError("Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={onClose}>
        <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl" style={{ backgroundColor: c.elevated, maxHeight: "80%" }}>
          <View className="p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20 }}>Search Food</Text>
              <Pressable onPress={onClose}>
                <MaterialCommunityIcons name="close" size={24} color={c.textMuted} />
              </Pressable>
            </View>

            <View className="flex-row gap-2 mb-4">
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search OpenFoodFacts..."
                placeholderTextColor={c.placeholder}
                className="flex-1 rounded-xl px-4 py-3"
                style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular" }}
                onSubmitEditing={search}
                returnKeyType="search"
                autoFocus
              />
              <Pressable
                onPress={search}
                disabled={loading}
                className="rounded-xl px-5 py-3 items-center justify-center"
                style={{ backgroundColor: ACCENT.lime, opacity: loading ? 0.5 : 1 }}
              >
                <MaterialCommunityIcons name="magnify" size={20} color="#161e00" />
              </Pressable>
            </View>

            {loading && <ActivityIndicator color={ACCENT.lime} />}

            {error && (
              <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: ACCENT.roseBg }}>
                <Text style={{ color: ACCENT.rose, fontFamily: "Inter_400Regular", fontSize: 13 }}>{error}</Text>
              </View>
            )}
          </View>

          {results.length > 0 && (
            <ScrollView className="px-6 pb-6" style={{ maxHeight: 400 }} showsVerticalScrollIndicator={true}>
              {results.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => { onSelect(item); onClose(); }}
                  className="rounded-xl p-4 mb-2"
                  style={{ backgroundColor: c.cardBgAlt }}
                >
                  <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 15 }}>{item.name}</Text>
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
          )}

          {!loading && !error && results.length === 0 && query.length > 0 && (
            <View className="px-6 pb-6 items-center">
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" }}>
                No results. Try a different search term.
              </Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
