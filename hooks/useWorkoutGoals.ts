import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { WorkoutGoal } from "@/lib/types";

const DEFAULT_EXERCISES = [
  { exercise_type: "pushups", daily_goal: 100, calories_per_rep: 0.5 },
  { exercise_type: "crunches", daily_goal: 100, calories_per_rep: 0.3 },
  { exercise_type: "situps", daily_goal: 50, calories_per_rep: 0.4 },
  { exercise_type: "squats", daily_goal: 50, calories_per_rep: 0.8 },
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
        .eq("user_id", userId)
        .order("exercise_type", { ascending: true });

      if (error) {
        console.error("Error fetching workout goals:", error);
        return [];
      }

      // If no goals exist, seed defaults
      if (!data || data.length === 0) {
        const { data: seeded, error: seedError } = await supabase
          .from("workout_goals")
          .insert(DEFAULT_EXERCISES.map((e) => ({ user_id: userId, ...e })))
          .select();

        if (seedError) {
          console.error("Error seeding workout goals:", seedError);
          return [];
        }
        return seeded ?? [];
      }

      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, updates }: { goalId: string; updates: Partial<WorkoutGoal> }) => {
      const { error } = await supabase
        .from("workout_goals")
        .update(updates)
        .eq("id", goalId);
      if (error) throw error;
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
    }: {
      exerciseType: string;
      dailyGoal: number;
      caloriesPerRep: number;
    }) => {
      if (!userId) throw new Error("No user");
      const { data, error } = await supabase
        .from("workout_goals")
        .insert({
          user_id: userId,
          exercise_type: exerciseType,
          daily_goal: dailyGoal,
          calories_per_rep: caloriesPerRep,
          enabled: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<WorkoutGoal[]>(["workout_goals", userId], (old) => [
        ...(old ?? []),
        data,
      ]);
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
    caloriesPerRep: number
  ) => {
    try {
      const data = await addCustomExerciseMutation.mutateAsync({
        exerciseType,
        dailyGoal,
        caloriesPerRep,
      });
      return { error: null, data };
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
    refetch: () => queryClient.invalidateQueries({ queryKey: ["workout_goals", userId] }),
  };
}
