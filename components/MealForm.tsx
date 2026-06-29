import React, { useState } from "react";
import { Pressable, View, Text, TextInput } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";

type MealFormProps = {
  onSubmit: (meal: { name: string; brand: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; serving_size?: string; quantity: number }) => void;
  onCancel?: () => void;
};

export function MealForm({ onSubmit, onCancel }: MealFormProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [quantity, setQuantity] = useState("1");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(), brand: brand.trim(), calories: Number(calories) || 0,
      protein_g: Number(protein) || 0, carbs_g: Number(carbs) || 0, fat_g: Number(fat) || 0,
      serving_size: servingSize.trim() || undefined, quantity: Number(quantity) || 1,
    });
    setName(""); setBrand(""); setServingSize(""); setCalories(""); setProtein(""); setCarbs(""); setFat(""); setQuantity("1");
  };

  const inputStyle = { backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular" as const };

  return (
    <View className="rounded-xl p-5" style={{ backgroundColor: c.elevated }}>
      <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-lg mb-4">Add Custom Item</Text>

      <TextInput value={name} onChangeText={setName} placeholder="Food name" placeholderTextColor={c.placeholder} className="rounded-xl px-4 py-3 mb-3" style={inputStyle} />
      <TextInput value={brand} onChangeText={setBrand} placeholder="Brand (optional)" placeholderTextColor={c.placeholder} className="rounded-xl px-4 py-3 mb-3" style={inputStyle} />
      <TextInput value={servingSize} onChangeText={setServingSize} placeholder="Serving size (e.g., 1 slice, 100g)" placeholderTextColor={c.placeholder} className="rounded-xl px-4 py-3 mb-3" style={inputStyle} />

      <View className="flex-row gap-2 mb-3">
        <View className="flex-1">
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Calories</Text>
          <TextInput value={calories} onChangeText={setCalories} placeholder="0" placeholderTextColor={c.placeholder} keyboardType="numeric" className="rounded-xl px-4 py-3" style={inputStyle} />
        </View>
        <View className="flex-1">
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Protein (g)</Text>
          <TextInput value={protein} onChangeText={setProtein} placeholder="0" placeholderTextColor={c.placeholder} keyboardType="numeric" className="rounded-xl px-4 py-3" style={inputStyle} />
        </View>
      </View>

      <View className="flex-row gap-2 mb-3">
        <View className="flex-1">
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Carbs (g)</Text>
          <TextInput value={carbs} onChangeText={setCarbs} placeholder="0" placeholderTextColor={c.placeholder} keyboardType="numeric" className="rounded-xl px-4 py-3" style={inputStyle} />
        </View>
        <View className="flex-1">
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-1">Fat (g)</Text>
          <TextInput value={fat} onChangeText={setFat} placeholder="0" placeholderTextColor={c.placeholder} keyboardType="numeric" className="rounded-xl px-4 py-3" style={inputStyle} />
        </View>
      </View>

      <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs mb-2">Quantity</Text>
      <TextInput value={quantity} onChangeText={setQuantity} placeholder="1" placeholderTextColor={c.placeholder} keyboardType="numeric" className="rounded-xl px-4 py-3 mb-4" style={inputStyle} />

      <View className="flex-row gap-3">
        {onCancel && (
          <Pressable onPress={onCancel} className="flex-1 rounded-xl py-3" style={{ backgroundColor: c.buttonBg }}>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-center">Cancel</Text>
          </Pressable>
        )}
        <Pressable onPress={handleSubmit} className="flex-1 rounded-xl py-3" style={{ backgroundColor: accent.lime }}>
          <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold" }} className="text-center">Add to Meal</Text>
        </Pressable>
      </View>
    </View>
  );
}
