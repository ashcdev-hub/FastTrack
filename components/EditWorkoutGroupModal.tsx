import React, { useState, useEffect } from "react";
import { Pressable, View, Text, TextInput, ScrollView, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import { WorkoutIcon } from "@/components/WorkoutIcon";
import { EXERCISE_CATEGORIES } from "@/lib/exercise-icons";
import type { WorkoutGoal } from "@/lib/types";

type EditWorkoutGroupModalProps = {
  visible: boolean;
  group?: { id: string; name: string; exercises: WorkoutGoal[] } | null;
  allGoals: WorkoutGoal[];
  onSave: (data: { name: string; goalIds: string[] }) => Promise<void>;
  onClose: () => void;
};

export function EditWorkoutGroupModal({
  visible,
  group,
  allGoals,
  onSave,
  onClose,
}: EditWorkoutGroupModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (group) {
        setName(group.name);
        setSelectedIds(new Set(group.exercises.map((e) => e.id)));
      } else {
        setName("");
        setSelectedIds(new Set());
      }
    }
  }, [visible, group]);

  const toggleGoal = (goalId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), goalIds: [...selectedIds] });
      onClose();
    } catch {}
    setSaving(false);
  };

  // Group goals by category for display
  const categorized = allGoals.reduce<Record<string, WorkoutGoal[]>>((acc, goal) => {
    const cat = EXERCISE_CATEGORIES[goal.exercise_type] ?? "OTHER";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(goal);
    return acc;
  }, {});
  const categoryOrder = ["UPPER BODY", "CORE", "LEGS", "OTHER"];
  const sortedCategories = categoryOrder.filter((cat) => categorized[cat]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={onClose}>
        <Pressable
          onStartShouldSetResponder={() => true}
          className="rounded-t-3xl p-6"
          style={{ backgroundColor: c.elevated, maxHeight: "85%" }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Pressable onPress={onClose}>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15 }}>
                Cancel
              </Text>
            </Pressable>
            <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20 }}>
              {group ? "Edit Group" : "Create Group"}
            </Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Name */}
            <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 11, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
              Group Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Leg Day"
              placeholderTextColor={c.textMuted}
              autoCapitalize="words"
              className="px-4 py-3 rounded-xl mb-5"
              style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 16, borderWidth: 1, borderColor: c.cardBorder }}
            />

            {/* Exercises */}
            <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 11, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
              Exercises
            </Text>

            {allGoals.length === 0 ? (
              <View className="py-8 items-center">
                <MaterialCommunityIcons name="dumbbell" size={32} color={c.textMuted} style={{ opacity: 0.4 }} />
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 8 }}>
                  No exercises yet. Add some first!
                </Text>
              </View>
            ) : (
              sortedCategories.map((cat) => (
                <View key={cat} className="mb-3">
                  <Text style={{ color: accent.cyan, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>
                    {cat}
                  </Text>
                  {categorized[cat].map((goal) => {
                    const isSelected = selectedIds.has(goal.id);
                    return (
                      <Pressable
                        key={goal.id}
                        onPress={() => toggleGoal(goal.id)}
                        className="flex-row items-center justify-between px-3 py-3 rounded-xl mb-1"
                        style={{ backgroundColor: isSelected ? accent.limeBg : c.cardBgAlt }}
                      >
                        <View className="flex-row items-center gap-3 flex-1">
                          <WorkoutIcon name={goal.icon_name ?? ""} size={20} color={isSelected ? accent.lime : c.textMuted} />
                          <View>
                            <Text
                              style={{ color: isSelected ? accent.lime : c.text, fontFamily: "Inter_700Bold", fontSize: 14, textTransform: "capitalize" }}
                            >
                              {goal.exercise_type}
                            </Text>
                            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 11 }}>
                              {goal.daily_goal} reps/day
                            </Text>
                          </View>
                        </View>
                        <MaterialCommunityIcons
                          name={isSelected ? "check-circle" : "circle-outline"}
                          size={22}
                          color={isSelected ? accent.lime : c.textMuted}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={!name.trim() || saving}
            className="w-full py-4 items-center mt-5 rounded-xl"
            style={{ backgroundColor: name.trim() ? accent.lime : c.buttonBg, opacity: saving ? 0.5 : 1 }}
          >
            <Text style={{ color: name.trim() ? c.textOnAccent : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 16 }}>
              {saving ? "Saving..." : group ? "Save Changes" : "Create Group"}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
