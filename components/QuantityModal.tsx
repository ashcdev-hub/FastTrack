import React, { useState } from "react";
import { Pressable, View, Text, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";

type QuantityModalProps = {
  visible: boolean;
  itemName: string;
  itemCalories: number;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
};

export function QuantityModal({ visible, itemName, itemCalories, onConfirm, onCancel }: QuantityModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const [quantity, setQuantity] = useState(1);

  const presets = [1, 2, 3, 5];

  const handleConfirm = () => {
    onConfirm(quantity);
    setQuantity(1);
  };

  const handleCancel = () => {
    onCancel();
    setQuantity(1);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={handleCancel}>
        <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
          <View className="flex-row justify-between items-center mb-2">
            <Pressable onPress={handleCancel}>
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }}>Cancel</Text>
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18 }}>Add to Meal</Text>
            <View className="w-12" />
          </View>

          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 22, textAlign: "center", marginTop: 8, marginBottom: 4 }}>
            {itemName}
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginBottom: 20 }}>
            1 serving = {itemCalories} kcal
          </Text>

          <View className="flex-row items-center justify-center gap-4 mb-3">
            <Pressable
              onPress={() => setQuantity(Math.max(0.5, quantity - 0.5))}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: c.buttonBg }}
            >
              <MaterialCommunityIcons name="minus" size={20} color={c.text} />
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 36, minWidth: 60, textAlign: "center" }}>
              {quantity}
            </Text>
            <Pressable
              onPress={() => setQuantity(quantity + 0.5)}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: c.buttonBg }}
            >
              <MaterialCommunityIcons name="plus" size={20} color={c.text} />
            </Pressable>
          </View>

          <View className="flex-row gap-2 mb-6">
            {presets.map((p) => (
              <Pressable
                key={p}
                onPress={() => setQuantity(p)}
                className="flex-1 py-2.5 rounded-xl items-center"
                style={{ backgroundColor: quantity === p ? accent.lime : c.buttonBg }}
              >
                <Text style={{ color: quantity === p ? c.textOnAccent : c.textSecondary, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="glass-bg glass-border p-4 mb-5 rounded-xl">
            <View className="flex-row justify-between mb-1">
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>Calories</Text>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                {Math.round(itemCalories * quantity)} kcal
              </Text>
            </View>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 11 }}>
              {quantity} × {itemCalories} kcal
            </Text>
          </View>

          <Pressable onPress={handleConfirm} className="rounded-xl py-3.5 items-center" style={{ backgroundColor: accent.lime }}>
            <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold", fontSize: 16 }}>
              Add {quantity > 1 ? `${quantity}× ` : ""}to Meal
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
