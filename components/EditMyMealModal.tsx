import React, { useState, useEffect } from "react";
import { Pressable, View, Text, TextInput, ScrollView, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import type { MyMeal, MyMealItem } from "@/lib/types";

type ItemForm = {
  name: string;
  brand: string;
  serving_size: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

type EditMyMealModalProps = {
  visible: boolean;
  meal?: MyMeal | null;
  onSave: (data: { name: string; description: string; items: Omit<MyMealItem, "id" | "meal_id" | "sort_order">[] }) => Promise<void>;
  onClose: () => void;
};

export function EditMyMealModal({ visible, meal, onSave, onClose }: EditMyMealModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<ItemForm[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newServing, setNewServing] = useState("");
  const [newCals, setNewCals] = useState(0);
  const [newProtein, setNewProtein] = useState(0);
  const [newCarbs, setNewCarbs] = useState(0);
  const [newFat, setNewFat] = useState(0);

  useEffect(() => {
    if (visible) {
      if (meal) {
        setName(meal.name);
        setDescription(meal.description ?? "");
        setItems(
          meal.items.map((i) => ({
            name: i.name,
            brand: i.brand ?? "",
            serving_size: i.serving_size ?? "",
            calories: i.calories,
            protein_g: i.protein_g ?? 0,
            carbs_g: i.carbs_g ?? 0,
            fat_g: i.fat_g ?? 0,
          }))
        );
      } else {
        setName("");
        setDescription("");
        setItems([]);
      }
      setShowAddItem(false);
      resetNewItem();
    }
  }, [visible, meal]);

  const resetNewItem = () => {
    setNewName("");
    setNewBrand("");
    setNewServing("");
    setNewCals(0);
    setNewProtein(0);
    setNewCarbs(0);
    setNewFat(0);
  };

  const handleAddItem = () => {
    if (!newName.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        name: newName.trim(),
        brand: newBrand.trim(),
        serving_size: newServing.trim(),
        calories: newCals,
        protein_g: newProtein,
        carbs_g: newCarbs,
        fat_g: newFat,
      },
    ]);
    resetNewItem();
    setShowAddItem(false);
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        items: items.map((item) => ({
          name: item.name,
          brand: item.brand || null,
          serving_size: item.serving_size || null,
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
        })),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const totalCals = items.reduce((s, i) => s + i.calories, 0);

  const macroFields = [
    { label: "CALORIES", val: newCals, set: setNewCals, step: 50, presets: [100, 200, 300, 500] },
    { label: "PROTEIN (g)", val: newProtein, set: setNewProtein, step: 5, presets: [10, 20, 30, 50] },
    { label: "CARBS (g)", val: newCarbs, set: setNewCarbs, step: 5, presets: [10, 20, 30, 50] },
    { label: "FAT (g)", val: newFat, set: setNewFat, step: 5, presets: [5, 10, 15, 20] },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={onClose}>
        <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated, maxHeight: "90%" }}>
          <View className="flex-row justify-between items-center mb-4">
            <Pressable onPress={onClose}>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15 }}>Cancel</Text>
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20 }}>
              {meal ? "Edit Meal" : "New Meal"}
            </Text>
            <Pressable onPress={handleSave} disabled={saving || !name.trim()}>
              <Text style={{ color: name.trim() ? accent.lime : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 15, opacity: name.trim() ? 1 : 0.5 }}>
                {saving ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 4 }}>MEAL NAME</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Pre-Workout Meal"
              placeholderTextColor={c.placeholder}
              className="rounded-xl px-4 py-3 mb-4"
              style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 15 }}
            />

            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 4 }}>DESCRIPTION (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Notes about this meal..."
              placeholderTextColor={c.placeholder}
              multiline
              numberOfLines={2}
              className="rounded-xl px-4 py-3 mb-5"
              style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 15, minHeight: 60 }}
            />

            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, textTransform: "uppercase" }}>
                ITEMS ({items.length}) — {totalCals} kcal total
              </Text>
              <Pressable onPress={() => setShowAddItem(true)}>
                <Text style={{ color: accent.cyan, fontFamily: "Inter_700Bold", fontSize: 13 }}>+ Add Item</Text>
              </Pressable>
            </View>

            {items.length === 0 && !showAddItem && (
              <View className="rounded-xl p-4 items-center mb-4" style={{ backgroundColor: c.cardBgAlt }}>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                  No items yet. Add food items to build your meal.
                </Text>
              </View>
            )}

            {items.map((item, idx) => (
              <View key={idx} className="flex-row items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
                <View className="flex-1">
                  <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }} numberOfLines={1}>{item.name}</Text>
                  <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                    {item.calories} kcal{item.protein_g ? ` · P${item.protein_g}g` : ""}
                    {item.carbs_g ? ` · C${item.carbs_g}g` : ""}
                    {item.fat_g ? ` · F${item.fat_g}g` : ""}
                    {item.serving_size ? ` · ${item.serving_size}` : ""}
                  </Text>
                </View>
                <Pressable onPress={() => handleRemoveItem(idx)} className="p-2">
                  <MaterialCommunityIcons name="delete-outline" size={18} color={c.textMuted} />
                </Pressable>
              </View>
            ))}

            {showAddItem && (
              <View className="rounded-xl p-4 mt-3 mb-4" style={{ backgroundColor: c.cardBg }}>
                <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 12 }}>Add Item</Text>

                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 4 }}>NAME</Text>
                <TextInput value={newName} onChangeText={setNewName} placeholder="e.g. Banana" placeholderTextColor={c.placeholder}
                  className="rounded-xl px-4 py-2 mb-3" style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }} />

                <View className="flex-row gap-2 mb-3">
                  <View className="flex-1">
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 4 }}>BRAND</Text>
                    <TextInput value={newBrand} onChangeText={setNewBrand} placeholder="Generic" placeholderTextColor={c.placeholder}
                      className="rounded-xl px-4 py-2" style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }} />
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 4 }}>SERVING</Text>
                    <TextInput value={newServing} onChangeText={setNewServing} placeholder="1 cup" placeholderTextColor={c.placeholder}
                      className="rounded-xl px-4 py-2" style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }} />
                  </View>
                </View>

                {macroFields.map((macro) => (
                  <View key={macro.label} className="mb-3 last:mb-0">
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 2 }}>{macro.label}</Text>
                    <View className="flex-row items-center gap-2 rounded-xl px-2" style={{ backgroundColor: c.inputBg }}>
                      <Pressable onPress={() => macro.set(Math.max(0, macro.val - macro.step))} className="p-1.5">
                        <MaterialCommunityIcons name="minus" size={16} color={c.text} />
                      </Pressable>
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 15, flex: 1, textAlign: "center" }}>{macro.val}</Text>
                      <Pressable onPress={() => macro.set(macro.val + macro.step)} className="p-1.5">
                        <MaterialCommunityIcons name="plus" size={16} color={c.text} />
                      </Pressable>
                    </View>
                    <View className="flex-row gap-1 mt-1">
                      {macro.presets.map((v) => (
                        <Pressable key={v} onPress={() => macro.set(v)}
                          className="flex-1 py-1 rounded-md items-center"
                          style={{ backgroundColor: macro.val === v ? accent.limeBg : c.buttonBg }}>
                          <Text style={{ color: macro.val === v ? accent.lime : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 11 }}>{v}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}

                <View className="flex-row gap-2 mt-3">
                  <Pressable onPress={() => setShowAddItem(false)} className="flex-1 py-2 rounded-xl items-center" style={{ backgroundColor: c.buttonBg }}>
                    <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14 }}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={handleAddItem} className="flex-1 py-2 rounded-xl items-center" style={{ backgroundColor: accent.lime, opacity: newName.trim() ? 1 : 0.5 }} disabled={!newName.trim()}>
                    <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold", fontSize: 14 }}>Add</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <Pressable onPress={handleSave} disabled={saving || !name.trim()} className="rounded-xl py-3.5 items-center mb-4" style={{ backgroundColor: name.trim() ? accent.lime : c.buttonBg }}>
              <Text style={{ color: name.trim() ? c.textOnAccent : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 16 }}>
                {saving ? "Saving..." : meal ? "Save Changes" : "Create Meal"}
              </Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
