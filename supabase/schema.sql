-- FastTrack Database Schema
-- Run this in your Supabase SQL Editor

-- Profiles (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  weight_kg NUMERIC(10,2),
  daily_calorie_goal INTEGER DEFAULT 2000,
  daily_protein_goal NUMERIC(10,2) DEFAULT 150,
  daily_carbs_goal NUMERIC(10,2) DEFAULT 200,
  daily_fat_goal NUMERIC(10,2) DEFAULT 65,
  fasting_hours INTEGER DEFAULT 16,
  eating_hours INTEGER DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fasting Sessions (Tracks the daily fast/eat window)
CREATE TABLE IF NOT EXISTS fasting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'fasting' CHECK (status IN ('fasting', 'eating', 'broken', 'completed')),
  fasting_duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Food Log (Macros & Calories)
CREATE TABLE IF NOT EXISTS food_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  session_id UUID REFERENCES fasting_sessions(id) ON DELETE SET NULL ON UPDATE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  serving_size TEXT,
  calories INTEGER NOT NULL,
  protein_g NUMERIC(10,2),
  carbs_g NUMERIC(10,2),
  fat_g NUMERIC(10,2),
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Water Log
CREATE TABLE IF NOT EXISTS water_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  amount_ml INTEGER NOT NULL DEFAULT 250,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Summaries (For the email digest)
CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  summary_date DATE NOT NULL,
  total_calories INTEGER DEFAULT 0,
  total_protein_g NUMERIC(10,2) DEFAULT 0,
  total_carbs_g NUMERIC(10,2) DEFAULT 0,
  total_fat_g NUMERIC(10,2) DEFAULT 0,
  water_ml INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, summary_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_user_id ON fasting_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_fasting_sessions_status ON fasting_sessions(status);
CREATE INDEX IF NOT EXISTS idx_food_log_user_id ON food_log(user_id);
CREATE INDEX IF NOT EXISTS idx_food_log_logged_at ON food_log(logged_at);
CREATE INDEX IF NOT EXISTS idx_water_log_user_id ON water_log(user_id);
CREATE INDEX IF NOT EXISTS idx_water_log_logged_at ON water_log(logged_at);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Fasting Sessions: Users can CRUD their own sessions
CREATE POLICY "Users can view own fasting sessions" ON fasting_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fasting sessions" ON fasting_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fasting sessions" ON fasting_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fasting sessions" ON fasting_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Food Log: Users can CRUD their own entries
CREATE POLICY "Users can view own food log" ON food_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food log" ON food_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food log" ON food_log
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food log" ON food_log
  FOR DELETE USING (auth.uid() = user_id);

-- Water Log: Users can CRUD their own entries
CREATE POLICY "Users can view own water log" ON water_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water log" ON water_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own water log" ON water_log
  FOR DELETE USING (auth.uid() = user_id);

-- Daily Summaries: Users can read their own summaries
CREATE POLICY "Users can view own daily summaries" ON daily_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily summaries" ON daily_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
