export type FastingSession = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  status: "fasting" | "eating" | "broken" | "completed";
  fasting_duration_minutes: number | null;
  fasting_schedule: string | null;
  created_at: string;
};

export type FoodLogEntry = {
  id: string;
  user_id: string;
  session_id: string | null;
  name: string;
  brand: string | null;
  serving_size: string | null;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack" | "other";
  logged_at: string;
};

export type WaterLog = {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
};

export type DailySummary = {
  id: string;
  user_id: string;
  summary_date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  water_ml: number;
  generated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  weight_kg: number | null;
  gender: "male" | "female" | "other" | null;
  age: number | null;
  height_cm: number | null;
  bmi: number | null;
  notification_preferences: {
    fasting_reminders: boolean;
    eating_reminders: boolean;
    daily_digest: boolean;
    streak_reminders: boolean;
    water_reminders: boolean;
    checkin_reminders: boolean;
    reminder_time: string;
    water_interval_hours: number;
  };
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fat_goal: number;
  fasting_hours: number;
  eating_hours: number;
  goal_weight_kg: number | null;
  created_at: string;
  updated_at: string;
};

export type FastCheckIn = {
  id: string;
  user_id: string;
  session_id: string;
  mood: number;
  note: string | null;
  phase: "fasting" | "eating";
  created_at: string;
};

export type WorkoutGoal = {
  id: string;
  user_id: string;
  exercise_type: string;
  daily_goal: number;
  calories_per_rep: number;
  enabled: boolean;
};

export type WorkoutLogEntry = {
  id: string;
  user_id: string;
  exercise_type: string;
  reps: number;
  sets: number;
  calories_burned: number | null;
  logged_at: string;
};

export type WeightLogEntry = {
  id: string;
  user_id: string;
  weight_kg: number;
  logged_at: string;
  created_at: string;
};
