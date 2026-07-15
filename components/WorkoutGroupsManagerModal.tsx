import React, { useState } from "react";
import { Pressable, View, Text, ScrollView, Modal, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import { useWorkoutGroups } from "@/hooks/useWorkoutGroups";
import { useWorkoutGoals } from "@/hooks/useWorkoutGoals";
import { EditWorkoutGroupModal } from "@/components/EditWorkoutGroupModal";
import { GlassPanel } from "@/components/GlassPanel";
import type { WorkoutGroup } from "@/lib/types";

type WorkoutGroupsManagerModalProps = {
  visible: boolean;
  userId: string | undefined;
  onClose: () => void;
};

export function WorkoutGroupsManagerModal({
  visible,
  userId,
  onClose,
}: WorkoutGroupsManagerModalProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const { groups, loading, addGroup, updateGroup, deleteGroup } = useWorkoutGroups(userId);
  const { goals, addCustomExercise } = useWorkoutGoals(userId);

  const [showEdit, setShowEdit] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WorkoutGroup | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<WorkoutGroup | null>(null);

  const handleAdd = () => {
    setEditingGroup(null);
    setShowEdit(true);
  };

  const handleEdit = (group: WorkoutGroup) => {
    setEditingGroup(group);
    setShowEdit(true);
  };

  const handleSave = async (data: { name: string; goalIds: string[] }) => {
    if (editingGroup) {
      await updateGroup(editingGroup.id, { name: data.name, goalIds: data.goalIds });
    } else {
      await addGroup(data.name, data.goalIds);
    }
  };

  const handleAddExercise = async (exName: string, dailyGoal: number, caloriesPerRep: number) => {
    const { error, data } = await addCustomExercise(exName, dailyGoal, caloriesPerRep);
    if (error || !data) return null;
    return { id: data.id };
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    await deleteGroup(showDeleteConfirm.id);
    setShowDeleteConfirm(null);
  };

  const enabledGoals = goals.filter((g) => g.enabled);

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={onClose}>
          <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated, maxHeight: "85%" }}>
            <View className="flex-row justify-between items-center mb-4">
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20 }}>Workout Groups</Text>
              <Pressable onPress={handleAdd}>
                <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold", fontSize: 14 }}>Add</Text>
              </Pressable>
            </View>

            {loading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color={accent.lime} />
              </View>
            ) : groups.length === 0 ? (
              <GlassPanel className="p-6 items-center rounded-xl">
                <View className="rounded-full items-center justify-center mb-4" style={{ width: 56, height: 56, backgroundColor: accent.limeBg }}>
                  <MaterialCommunityIcons name="dumbbell" size={28} color={accent.lime} />
                </View>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center" }}>
                  No groups yet. Create one to organize your exercises!
                </Text>
              </GlassPanel>
            ) : (
              <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={true}>
                {groups.map((group) => (
                  <View key={group.id} className="flex-row items-center py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
                    <View className="rounded-lg items-center justify-center mr-3" style={{ width: 36, height: 36, backgroundColor: accent.limeBg }}>
                      <MaterialCommunityIcons name="dumbbell" size={18} color={accent.lime} />
                    </View>
                    <View className="flex-1">
                      <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }} numberOfLines={1}>
                        {group.name}
                      </Text>
                      <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                        {group.exercises.length} {group.exercises.length === 1 ? "exercise" : "exercises"}
                      </Text>
                    </View>
                    <Pressable onPress={() => handleEdit(group)} className="p-2">
                      <MaterialCommunityIcons name="pencil-outline" size={18} color={c.textMuted} />
                    </Pressable>
                    <Pressable onPress={() => setShowDeleteConfirm(group)} className="p-2">
                      <MaterialCommunityIcons name="delete-outline" size={18} color={c.textMuted} />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}

            <Pressable onPress={onClose} className="py-3.5 items-center mt-4 rounded-xl" style={{ backgroundColor: c.buttonBg }}>
              <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 15 }}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <EditWorkoutGroupModal
        visible={showEdit}
        group={editingGroup}
        allGoals={enabledGoals}
        onSave={handleSave}
        onClose={() => setShowEdit(false)}
        onAddExercise={handleAddExercise}
      />

      {/* Delete Confirmation Modal */}
      <Modal visible={!!showDeleteConfirm} transparent animationType="slide" onRequestClose={() => setShowDeleteConfirm(null)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowDeleteConfirm(null)}>
          <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
            <View className="items-center mb-6">
              <View className="rounded-full items-center justify-center mb-4" style={{ width: 56, height: 56, backgroundColor: ACCENT.roseBg }}>
                <MaterialCommunityIcons name="delete-outline" size={28} color={ACCENT.rose} />
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 4 }}>
                Delete "{showDeleteConfirm?.name}"?
              </Text>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" }}>
                All exercises will stay available — they just won't be grouped.
              </Text>
            </View>
            <Pressable onPress={handleDelete} className="py-3.5 items-center mb-3 rounded-xl" style={{ backgroundColor: ACCENT.rose }}>
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
