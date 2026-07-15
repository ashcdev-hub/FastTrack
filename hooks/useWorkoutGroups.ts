import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { WorkoutGroup, WorkoutGoal } from "@/lib/types";
import { EXERCISE_CATEGORIES } from "@/lib/exercise-icons";
import { withOfflineFallback } from "@/lib/offline-mutation";

function toGroupWithExercises(
  group: any,
  joinRows: any[],
  goals: WorkoutGoal[],
): WorkoutGroup {
  const sortedJoins = (joinRows ?? [])
    .filter((j: any) => j.group_id === group.id)
    .sort((a: any, b: any) => a.sort_order - b.sort_order);

  return {
    ...group,
    exercises: sortedJoins
      .map((j: any) => goals.find((g) => g.id === j.goal_id))
      .filter(Boolean) as WorkoutGoal[],
  };
}

export function useWorkoutGroups(userId: string | undefined) {
  const queryClient = useQueryClient();
  const seededRef = useRef(false);

  const { data: groups = [], isLoading: loading } = useQuery({
    queryKey: ["workout_groups", userId],
    queryFn: async (): Promise<WorkoutGroup[]> => {
      if (!userId) return [];

      const { data: groupData, error: groupError } = await supabase
        .from("workout_groups")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true });

      if (groupError) {
        console.error("Error fetching workout groups:", groupError);
        return [];
      }

      if (groupData.length === 0) return [];

      const groupIds = groupData.map((g: any) => g.id);

      const { data: joinData, error: joinError } = await supabase
        .from("workout_group_exercises")
        .select("*")
        .in("group_id", groupIds)
        .order("sort_order", { ascending: true });

      if (joinError) {
        console.error("Error fetching workout group exercises:", joinError);
        return groupData.map((g: any) => toGroupWithExercises(g, [], []));
      }

      const goalIds = (joinData ?? []).map((j: any) => j.goal_id);
      if (goalIds.length === 0) {
        return groupData.map((g: any) => toGroupWithExercises(g, joinData ?? [], []));
      }

      const { data: goalsData, error: goalsError } = await supabase
        .from("workout_goals")
        .select("*")
        .in("id", goalIds);

      if (goalsError) {
        console.error("Error fetching workout goals:", goalsError);
        return groupData.map((g: any) => toGroupWithExercises(g, joinData ?? [], []));
      }

      return groupData.map((g: any) =>
        toGroupWithExercises(g, joinData ?? [], goalsData ?? []),
      );
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });

  // Auto-suggest: seed groups from EXERCISE_CATEGORIES on first visit
  useEffect(() => {
    if (!userId || loading || groups.length > 0 || seededRef.current) return;
    const goals = queryClient.getQueryData<WorkoutGoal[]>(["workout_goals", userId]);
    if (!goals || goals.length === 0) return;
    seededRef.current = true;

    const seedDefaultGroups = async () => {
      const catMap: Record<string, string[]> = {};
      for (const goal of goals) {
        const cat = EXERCISE_CATEGORIES[goal.exercise_type];
        if (!cat) continue;
        if (!catMap[cat]) catMap[cat] = [];
        catMap[cat].push(goal.exercise_type);
      }

      for (const [catName, exerciseTypes] of Object.entries(catMap)) {
        const goalIds = goals
          .filter((g) => exerciseTypes.includes(g.exercise_type))
          .map((g) => g.id);

        if (goalIds.length === 0) continue;

        await supabase.from("workout_groups").insert({
          user_id: userId,
          name: catName.charAt(0).toUpperCase() + catName.slice(1).toLowerCase(),
        });
      }

      queryClient.invalidateQueries({ queryKey: ["workout_groups", userId] });
    };

    seedDefaultGroups();
  }, [userId, loading, groups, queryClient]);

  const addGroupMutation = useMutation({
    mutationFn: async ({
      name,
      goalIds,
    }: {
      name: string;
      goalIds: string[];
    }) => {
      if (!userId) throw new Error("No user");

      return withOfflineFallback(
        async () => {
          const { data: group, error: groupError } = await supabase
            .from("workout_groups")
            .insert({ user_id: userId, name })
            .select()
            .single();
          if (groupError) throw groupError;

          if (goalIds.length > 0) {
            const { error: joinError } = await supabase
              .from("workout_group_exercises")
              .insert(
                goalIds.map((goalId, idx) => ({
                  group_id: group.id,
                  goal_id: goalId,
                  sort_order: idx,
                })),
              );
            if (joinError) throw joinError;
          }

          return group as WorkoutGroup;
        },
        "workout_groups",
        "insert",
        { name, goalIds },
        false,
      );
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ["workout_groups", userId] });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      goalIds,
    }: {
      id: string;
      name?: string;
      goalIds?: string[];
    }) => {
      return withOfflineFallback(
        async () => {
          if (name !== undefined) {
            const { error } = await supabase
              .from("workout_groups")
              .update({ name })
              .eq("id", id);
            if (error) throw error;
          }

          if (goalIds !== undefined) {
            const { error: delError } = await supabase
              .from("workout_group_exercises")
              .delete()
              .eq("group_id", id);
            if (delError) throw delError;

            if (goalIds.length > 0) {
              const { error: insError } = await supabase
                .from("workout_group_exercises")
                .insert(
                  goalIds.map((goalId, idx) => ({
                    group_id: id,
                    goal_id: goalId,
                    sort_order: idx,
                  })),
                );
              if (insError) throw insError;
            }
          }

          return { id, name, goalIds };
        },
        "workout_groups",
        "update",
        { id, name, goalIds },
        false,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout_groups", userId] });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      return withOfflineFallback(
        async () => {
          const { error } = await supabase.from("workout_groups").delete().eq("id", id);
          if (error) throw error;
          return id;
        },
        "workout_groups",
        "delete",
        { id },
        false,
      );
    },
    onSuccess: (id) => {
      if (!id) return;
      queryClient.setQueryData<WorkoutGroup[]>(["workout_groups", userId], (old) =>
        (old ?? []).filter((g) => g.id !== id),
      );
    },
  });

  const reorderGroupGoalMutation = useMutation({
    mutationFn: async ({
      groupId,
      goalId,
      direction,
    }: {
      groupId: string;
      goalId: string;
      direction: "up" | "down";
    }) => {
      const { data: joinRows, error: fetchError } = await supabase
        .from("workout_group_exercises")
        .select("*")
        .eq("group_id", groupId)
        .order("sort_order", { ascending: true });

      if (fetchError) throw fetchError;
      if (!joinRows || joinRows.length <= 1) throw new Error("Cannot reorder");

      const sorted = [...joinRows].sort((a: any, b: any) => a.sort_order - b.sort_order);
      const idx = sorted.findIndex((j: any) => j.goal_id === goalId);
      if (idx < 0) throw new Error("Goal not in group");

      if (direction === "up" && idx === 0) throw new Error("Already first");
      if (direction === "down" && idx === sorted.length - 1) throw new Error("Already last");

      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const currentSort = sorted[idx].sort_order;
      const swapSort = sorted[swapIdx].sort_order;

      const { error: err1 } = await supabase
        .from("workout_group_exercises")
        .update({ sort_order: swapSort })
        .eq("id", sorted[idx].id);
      if (err1) throw err1;

      const { error: err2 } = await supabase
        .from("workout_group_exercises")
        .update({ sort_order: currentSort })
        .eq("id", sorted[swapIdx].id);
      if (err2) throw err2;

      return { groupId, goalId, direction };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout_groups", userId] });
    },
  });

  const removeFromGroupMutation = useMutation({
    mutationFn: async ({
      groupId,
      goalId,
    }: {
      groupId: string;
      goalId: string;
    }) => {
      return withOfflineFallback(
        async () => {
          const { error } = await supabase
            .from("workout_group_exercises")
            .delete()
            .eq("group_id", groupId)
            .eq("goal_id", goalId);
          if (error) throw error;
          return { groupId, goalId };
        },
        "workout_group_exercises",
        "delete",
        { groupId, goalId },
        false,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout_groups", userId] });
    },
  });

  const addGroup = async (name: string, goalIds: string[]) => {
    try {
      await addGroupMutation.mutateAsync({ name, goalIds });
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const updateGroup = async (id: string, updates: { name?: string; goalIds?: string[] }) => {
    try {
      await updateGroupMutation.mutateAsync({ id, ...updates });
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      await deleteGroupMutation.mutateAsync(id);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const reorderGroupGoal = async (groupId: string, goalId: string, direction: "up" | "down") => {
    try {
      await reorderGroupGoalMutation.mutateAsync({ groupId, goalId, direction });
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const removeFromGroup = async (groupId: string, goalId: string) => {
    try {
      await removeFromGroupMutation.mutateAsync({ groupId, goalId });
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  return {
    groups,
    loading,
    addGroup,
    updateGroup,
    deleteGroup,
    reorderGroupGoal,
    removeFromGroup,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["workout_groups", userId] }),
  };
}
