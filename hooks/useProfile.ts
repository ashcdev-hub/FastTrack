import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    }

    setProfile(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateFastingSchedule = async (fastingHours: number, eatingHours: number) => {
    if (!userId) return;

    const { error } = await supabase
      .from("profiles")
      .update({ fasting_hours: fastingHours, eating_hours: eatingHours })
      .eq("id", userId);

    if (error) {
      console.error("Error updating fasting schedule:", error);
    } else {
      setProfile((prev) =>
        prev ? { ...prev, fasting_hours: fastingHours, eating_hours: eatingHours } : prev
      );
    }
  };

  const updateGoals = async (goals: Partial<Pick<Profile,
    "daily_calorie_goal" | "daily_protein_goal" | "daily_carbs_goal" | "daily_fat_goal"
  >>) => {
    if (!userId) return;

    const { error } = await supabase
      .from("profiles")
      .update(goals)
      .eq("id", userId);

    if (error) {
      console.error("Error updating goals:", error);
    } else {
      setProfile((prev) => (prev ? { ...prev, ...goals } : prev));
    }
  };

  const updateProfile = async (updates: Partial<Pick<Profile,
    "display_name" | "gender" | "age" | "weight_kg" | "height_cm" | "goal_weight_kg"
  >>) => {
    if (!userId) return { error: new Error("No user") };

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return { error };
    }

    if (data) setProfile(data);
    return { error: null };
  };

  const updateNotificationPreferences = async (preferences: Profile["notification_preferences"]) => {
    if (!userId) return { error: new Error("No user") };

    const { error } = await supabase
      .from("profiles")
      .update({ notification_preferences: preferences })
      .eq("id", userId);

    if (error) {
      console.error("Error updating notification preferences:", error);
      return { error };
    }

    setProfile((prev) => (prev ? { ...prev, notification_preferences: preferences } : prev));
    return { error: null };
  };

  const updateUnitPreferences = async (preferences: Profile["unit_preferences"]) => {
    if (!userId) return { error: new Error("No user") };

    const { error } = await supabase
      .from("profiles")
      .update({ unit_preferences: preferences })
      .eq("id", userId);

    if (error) {
      console.error("Error updating unit preferences:", error);
      return { error };
    }

    setProfile((prev) => (prev ? { ...prev, unit_preferences: preferences } : prev));
    return { error: null };
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
    updatePassword,
    updateEmail,
    refetch: fetchProfile,
  };
}
