import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { WorkoutGoal } from "@/lib/types";
import { withOfflineFallback } from "@/lib/offline-mutation";

const DEFAULT_EXERCISES = [
  { exercise_type: "pushups", daily_goal: 100, calories_per_rep: 0.5, icon_name: "weightlifting", sort_order: 0 },
  { exercise_type: "crunches", daily_goal: 100, calories_per_rep: 0.3, icon_name: "abs", sort_order: 1 },
  { exercise_type: "situps", daily_goal: 50, calories_per_rep: 0.4, icon_name: "abs", sort_order: 2 },
  { exercise_type: "squats", daily_goal: 50, calories_per_rep: 0.8, icon_name: "squats", sort_order: 3 },
];

export function useWorkoutGoals(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading: loading } = useQuery({
    queryKey: ["workout_goals", userId],
    queryFn: async (): Promise<WorkoutGoal[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("workout_goals")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching workout goals:", error);
        return [];
      }

      const isNewUser = !data || data.length === 0;
      if (isNewUser) {
        const { data: seeded, error: seedError } = await supabase
          .from("workout_goals")
          .insert(DEFAULT_EXERCISES.map((e) => ({ user_id: userId, ...e })))
          .select("*");

        if (seedError) {
          console.error("Error seeding workout goals:", seedError);
          return [];
        }
        return (seeded ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      }

      return (data ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, updates }: { goalId: string; updates: Partial<WorkoutGoal> }) => {
      return withOfflineFallback(
        async () => {
          const { error } = await supabase
            .from("workout_goals")
            .update(updates)
            .eq("id", goalId);
          if (error) throw error;
          return { goalId, updates };
        },
        "workout_goals",
        "update",
        { id: goalId, ...updates },
        false,
      );
    },
    onSuccess: (_data, { goalId, updates }) => {
      queryClient.setQueryData<WorkoutGoal[]>(["workout_goals", userId], (old) =>
        (old ?? []).map((g) => (g.id === goalId ? { ...g, ...updates } : g))
      );
    },
  });

  const addCustomExerciseMutation = useMutation({
    mutationFn: async ({
      exerciseType,
      dailyGoal,
      caloriesPerRep,
      iconName,
    }: {
      exerciseType: string;
      dailyGoal: number;
      caloriesPerRep: number;
      iconName?: string;
    }) => {
      if (!userId) throw new Error("No user");
      const goals = queryClient.getQueryData<WorkoutGoal[]>(["workout_goals", userId]) ?? [];
      const maxSort = goals.reduce((max, g) => Math.max(max, g.sort_order ?? 0), 0);

      return withOfflineFallback(
        async () => {
          const { data, error } = await supabase
            .from("workout_goals")
            .insert({
              user_id: userId,
              exercise_type: exerciseType,
              daily_goal: dailyGoal,
              calories_per_rep: caloriesPerRep,
              enabled: true,
              icon_name: iconName ?? null,
              sort_order: maxSort + 1,
            })
            .select("*")
            .single();
          if (error) throw error;
          return data;
        },
        "workout_goals",
        "insert",
        { user_id: userId, exercise_type: exerciseType, daily_goal: dailyGoal, calories_per_rep: caloriesPerRep, enabled: true, icon_name: iconName ?? null, sort_order: maxSort + 1 },
        false,
      );
    },
    onSuccess: (data) => {
      if (!data) return;
      queryClient.setQueryData<WorkoutGoal[]>(["workout_goals", userId], (old) => [
        ...(old ?? []),
        data,
      ]);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ goalId, direction }: { goalId: string; direction: "up" | "down" }) => {
      const goals = queryClient.getQueryData<WorkoutGoal[]>(["workout_goals", userId]) ?? [];
      const sorted = [...goals].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      const idx = sorted.findIndex((g) => g.id === goalId);
      if (idx < 0) throw new Error("Goal not found");

      if (direction === "up" && idx === 0) throw new Error("Already first");
      if (direction === "down" && idx === sorted.length - 1) throw new Error("Already last");

      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const currentSort = sorted[idx].sort_order ?? 0;
      const swapSort = sorted[swapIdx].sort_order ?? 0;

      return withOfflineFallback(
        async () => {
          const { error: err1 } = await supabase
            .from("workout_goals")
            .update({ sort_order: swapSort })
            .eq("id", sorted[idx].id);
          if (err1) throw err1;

          const { error: err2 } = await supabase
            .from("workout_goals")
            .update({ sort_order: currentSort })
            .eq("id", sorted[swapIdx].id);
          if (err2) throw err2;

          return { goalId, direction };
        },
        "workout_goals",
        "update",
        { ids: [sorted[idx].id, sorted[swapIdx].id] },
        false,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout_goals", userId] });
    },
  });

  const updateGoal = async (goalId: string, updates: Partial<WorkoutGoal>) => {
    try {
      await updateGoalMutation.mutateAsync({ goalId, updates });
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const toggleEnabled = async (goalId: string, enabled: boolean) => {
    return updateGoal(goalId, { enabled });
  };

  const addCustomExercise = async (
    exerciseType: string,
    dailyGoal: number,
    caloriesPerRep: number,
    iconName?: string,
  ) => {
    try {
      const data = await addCustomExerciseMutation.mutateAsync({
        exerciseType,
        dailyGoal,
        caloriesPerRep,
        iconName,
      });
      return { error: null, data };
    } catch (error) {
      return { error };
    }
  };

  const reorderGoal = async (goalId: string, direction: "up" | "down") => {
    try {
      await reorderMutation.mutateAsync({ goalId, direction });
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  return {
    goals,
    loading,
    updateGoal,
    toggleEnabled,
    addCustomExercise,
    reorderGoal,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["workout_goals", userId] }),
  };
}
