import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { WorkoutGoal } from "@/lib/types";

const DEFAULT_EXERCISES = [
  { exercise_type: "pushups", daily_goal: 100, calories_per_rep: 0.5 },
  { exercise_type: "crunches", daily_goal: 100, calories_per_rep: 0.3 },
  { exercise_type: "situps", daily_goal: 50, calories_per_rep: 0.4 },
  { exercise_type: "squats", daily_goal: 50, calories_per_rep: 0.8 },
];

export function useWorkoutGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<WorkoutGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("workout_goals")
      .select("*")
      .eq("user_id", userId)
      .order("exercise_type", { ascending: true });

    if (error) {
      console.error("Error fetching workout goals:", error);
      setLoading(false);
      return;
    }

    // If no goals exist, seed defaults
    if (!data || data.length === 0) {
      const { data: seeded, error: seedError } = await supabase
        .from("workout_goals")
        .insert(
          DEFAULT_EXERCISES.map((e) => ({
            user_id: userId,
            ...e,
          }))
        )
        .select();

      if (seedError) {
        console.error("Error seeding workout goals:", seedError);
      } else {
        setGoals(seeded ?? []);
      }
    } else {
      setGoals(data);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const updateGoal = async (goalId: string, updates: Partial<WorkoutGoal>) => {
    const { error } = await supabase
      .from("workout_goals")
      .update(updates)
      .eq("id", goalId);

    if (error) {
      console.error("Error updating workout goal:", error);
      return { error };
    }

    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, ...updates } : g))
    );
    return { error: null };
  };

  const toggleEnabled = async (goalId: string, enabled: boolean) => {
    return updateGoal(goalId, { enabled });
  };

  const addCustomExercise = async (
    exerciseType: string,
    dailyGoal: number,
    caloriesPerRep: number
  ) => {
    if (!userId) return { error: new Error("No user") };

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

    if (error) {
      console.error("Error adding custom exercise:", error);
      return { error };
    }

    setGoals((prev) => [...prev, data]);
    return { error: null, data };
  };

  return {
    goals,
    loading,
    updateGoal,
    toggleEnabled,
    addCustomExercise,
    refetch: fetchGoals,
  };
}
