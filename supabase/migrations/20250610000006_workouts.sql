-- Migration: Add workout tables
-- Adds workout_goals and workout_log tables with RLS policies

-- Workout Goals: one row per user per exercise type
CREATE TABLE IF NOT EXISTS workout_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  exercise_type TEXT NOT NULL,
  daily_goal INTEGER NOT NULL DEFAULT 100,
  calories_per_rep NUMERIC(10,2) NOT NULL DEFAULT 0.5,
  enabled BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, exercise_type)
);

-- Workout Log: individual set entries
CREATE TABLE IF NOT EXISTS workout_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  exercise_type TEXT NOT NULL,
  reps INTEGER NOT NULL,
  sets INTEGER NOT NULL DEFAULT 1,
  calories_burned NUMERIC(10,2),
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workout_goals_user_id ON workout_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_log_user_id ON workout_log(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_log_logged_at ON workout_log(logged_at);
CREATE INDEX IF NOT EXISTS idx_workout_log_exercise_type ON workout_log(exercise_type);

-- RLS
ALTER TABLE workout_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_log ENABLE ROW LEVEL SECURITY;

-- Workout Goals policies
CREATE POLICY "Users can view own workout goals" ON workout_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout goals" ON workout_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout goals" ON workout_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout goals" ON workout_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Workout Log policies
CREATE POLICY "Users can view own workout log" ON workout_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout log" ON workout_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout log" ON workout_log
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout log" ON workout_log
  FOR DELETE USING (auth.uid() = user_id);
