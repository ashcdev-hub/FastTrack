import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

export function useProfile(userId: string | null) {
  const queryClient = useQueryClient();

  const { data: profile = null, isLoading: loading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!userId) throw new Error("No user");
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["profile", userId], data);
    },
  });

  const updateFastingSchedule = async (fastingHours: number, eatingHours: number) => {
    await updateMutation.mutateAsync({
      fasting_hours: fastingHours,
      eating_hours: eatingHours,
    });
  };

  const updateGoals = async (
    goals: Partial<
      Pick<
        Profile,
        "daily_calorie_goal" | "daily_protein_goal" | "daily_carbs_goal" | "daily_fat_goal"
      >
    >
  ) => {
    await updateMutation.mutateAsync(goals);
  };

  const updateProfile = async (
    updates: Partial<
      Pick<Profile, "display_name" | "gender" | "age" | "weight_kg" | "height_cm" | "goal_weight_kg" | "onboarding_completed">
    >
  ) => {
    try {
      await updateMutation.mutateAsync(updates);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const updateNotificationPreferences = async (
    preferences: Profile["notification_preferences"]
  ) => {
    try {
      await updateMutation.mutateAsync({ notification_preferences: preferences });
      return { error: null };
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      return { error };
    }
  };

  const updateUnitPreferences = async (preferences: Profile["unit_preferences"]) => {
    try {
      await updateMutation.mutateAsync({ unit_preferences: preferences });
      return { error: null };
    } catch (error) {
      console.error("Error updating unit preferences:", error);
      return { error };
    }
  };

  const saveQuickAddFoods = async (foods: string[]) => {
    try {
      await updateMutation.mutateAsync({ quick_add_foods: foods } as any);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error("Error updating password:", error);
      return { error };
    }
    return { error: null };
  };

  const updateEmail = async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      console.error("Error updating email:", error);
      return { error };
    }
    return { error: null };
  };

  return {
    profile,
    loading,
    updateFastingSchedule,
    updateGoals,
    updateProfile,
    updateNotificationPreferences,
    updateUnitPreferences,
    saveQuickAddFoods,
    updatePassword,
    updateEmail,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
  };
}
