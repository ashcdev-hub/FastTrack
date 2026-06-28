import React, { useState } from "react";
import { Pressable, View, Text, ScrollView, Modal, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { useMyMeals } from "@/hooks/useMyMeals";
import { EditMyMealModal } from "@/components/EditMyMealModal";
import type { MyMeal, MyMealItem } from "@/lib/types";

type MyMealsManagerModalProps = {
  visible: boolean;
  userId: string | undefined;
  onClose: () => void;
};

export function MyMealsManagerModal({ visible, userId, onClose }: MyMealsManagerModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const { meals, loading, addMyMeal, updateMyMeal, deleteMyMeal } = useMyMeals(userId);

  const [showEdit, setShowEdit] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MyMeal | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<MyMeal | null>(null);

  const handleAdd = () => {
    setEditingMeal(null);
    setShowEdit(true);
  };

  const handleEdit = (meal: MyMeal) => {
    setEditingMeal(meal);
    setShowEdit(true);
  };

  const handleSave = async (data: { name: string; description: string; items: Omit<MyMealItem, "id" | "meal_id" | "sort_order">[] }) => {
    if (editingMeal) {
      await updateMyMeal(editingMeal.id, { name: data.name, description: data.description, items: data.items });
    } else {
      await addMyMeal(data.name, data.items, data.description);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    await deleteMyMeal(showDeleteConfirm.id);
    setShowDeleteConfirm(null);
  };

  const mealTotalCals = (meal: MyMeal) =>
    meal.items.reduce((s, i) => s + i.calories, 0);

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={onClose}>
          <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated, maxHeight: "85%" }}>
            <View className="flex-row justify-between items-center mb-4">
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20 }}>My Meals</Text>
              <Pressable onPress={handleAdd}>
                <Text style={{ color: ACCENT.lime, fontFamily: "Inter_700Bold", fontSize: 14 }}>Add</Text>
              </Pressable>
            </View>

            {loading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color={ACCENT.lime} />
              </View>
            ) : meals.length === 0 ? (
              <View className="glass-panel p-6 items-center rounded-xl">
                <View className="rounded-full items-center justify-center mb-4" style={{ width: 56, height: 56, backgroundColor: ACCENT.cyanBg }}>
                  <MaterialCommunityIcons name="bookmark-outline" size={28} color={ACCENT.cyan} />
                </View>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center" }}>
                  Save your first meal from the Food tab
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={true}>
                {meals.map((meal) => {
                  const totalCals = mealTotalCals(meal);
                  return (
                    <View key={meal.id} className="flex-row items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
                      <View className="rounded-lg items-center justify-center mr-3" style={{ width: 36, height: 36, backgroundColor: ACCENT.cyanBg }}>
                        <MaterialCommunityIcons name="bookmark-outline" size={18} color={ACCENT.cyan} />
                      </View>
                      <View className="flex-1">
                        <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }} numberOfLines={1}>{meal.name}</Text>
                        <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                          {totalCals} kcal · {meal.items.length} {meal.items.length === 1 ? "item" : "items"}
                        </Text>
                      </View>
                      <Pressable onPress={() => handleEdit(meal)} className="p-2">
                        <MaterialCommunityIcons name="pencil-outline" size={18} color={c.textMuted} />
                      </Pressable>
                      <Pressable onPress={() => setShowDeleteConfirm(meal)} className="p-2">
                        <MaterialCommunityIcons name="delete-outline" size={18} color={c.textMuted} />
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <Pressable onPress={onClose} className="rounded-xl py-3.5 items-center mt-4" style={{ backgroundColor: c.buttonBg }}>
              <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 15 }}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <EditMyMealModal
        visible={showEdit}
        meal={editingMeal}
        onSave={handleSave}
        onClose={() => setShowEdit(false)}
      />

      {/* Delete Confirmation Modal */}
      <Modal visible={!!showDeleteConfirm} transparent animationType="slide" onRequestClose={() => setShowDeleteConfirm(null)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowDeleteConfirm(null)}>
          <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
            <View className="items-center mb-6">
              <View className="rounded-full items-center justify-center mb-4" style={{ width: 56, height: 56, backgroundColor: ACCENT.roseBg }}>
                <MaterialCommunityIcons name="delete-outline" size={28} color={ACCENT.rose} />
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 4 }}>Delete Meal?</Text>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" }}>
                This will permanently remove "{showDeleteConfirm?.name}" from your saved meals.
              </Text>
            </View>
            <Pressable onPress={handleDelete} className="rounded-xl py-3.5 items-center mb-3" style={{ backgroundColor: ACCENT.rose }}>
              <Text style={{ color: c.textOnDark, fontFamily: "Inter_700Bold", fontSize: 16 }}>Delete</Text>
            </Pressable>
            <Pressable onPress={() => setShowDeleteConfirm(null)} className="py-3 items-center rounded-xl" style={{ backgroundColor: c.buttonBg }}>
              <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 15 }}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
