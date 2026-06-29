import React, { useState } from "react";
import { Pressable, View, Text, ScrollView, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";

const ALL_FOODS = [
  "Boiled Egg", "Fried Egg", "Scrambled Eggs",
  "White Rice (cooked)", "Brown Rice (cooked)",
  "Chicken Breast (cooked)", "Whole Wheat Bread", "White Bread",
  "Banana", "Apple", "Greek Yogurt", "Oatmeal (cooked)",
  "Coffee", "Milk", "Orange Juice", "Almonds",
  "Peanut Butter", "Avocado", "Sweet Potato", "Broccoli",
  "Salmon", "Beef (cooked)", "Tofu", "Pasta (cooked)",
  "Cheese", "Butter", "Olive Oil", "Honey",
];

type EditQuickAddModalProps = {
  visible: boolean;
  selectedFoods: string[];
  onSave: (foods: string[]) => void;
  onClose: () => void;
};

export function EditQuickAddModal({ visible, selectedFoods, onSave, onClose }: EditQuickAddModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const [selected, setSelected] = useState<string[]>(selectedFoods);

  const toggle = (food: string) => {
    setSelected((prev) =>
      prev.includes(food) ? prev.filter((f) => f !== food) : [...prev, food]
    );
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={onClose}>
        <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated, maxHeight: "85%" }}>
          <View className="flex-row justify-between items-center mb-4">
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20 }}>Quick Add Foods</Text>
            <Pressable onPress={handleSave}>
              <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold", fontSize: 14 }}>Done</Text>
            </Pressable>
          </View>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 16 }}>
            Choose foods that appear in your quick-add panel
          </Text>

          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={true}>
            <View className="flex-row flex-wrap gap-2">
              {ALL_FOODS.map((food) => {
                const isOn = selected.includes(food);
                return (
                  <Pressable
                    key={food}
                    onPress={() => toggle(food)}
                    style={{
                      backgroundColor: isOn ? accent.lime : c.inputBg,
                      borderWidth: 1,
                      borderColor: isOn ? accent.lime : c.cardBorder,
                    }}
                    className="rounded-xl px-3.5 py-2.5"
                  >
                    <View className="flex-row items-center gap-1.5">
                      {isOn && <MaterialCommunityIcons name="check" size={14} color={c.textOnAccent} />}
                      <Text style={{ color: isOn ? c.textOnAccent : c.text, fontFamily: isOn ? "Inter_700Bold" : "Inter_400Regular", fontSize: 13 }}>
                        {food}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <Pressable onPress={handleSave} className="rounded-xl py-3.5 items-center mt-4" style={{ backgroundColor: accent.lime }}>
            <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold", fontSize: 16 }}>
              Save ({selected.length} selected)
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
