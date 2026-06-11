-- Migration: Add weight tracking
-- Creates weight_log table and adds goal_weight_kg to profiles

-- Weight Log: track weight over time
CREATE TABLE IF NOT EXISTS weight_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  weight_kg NUMERIC(10,2) NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weight_log_user_id ON weight_log(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_log_logged_at ON weight_log(logged_at);

-- Unique constraint: one entry per user per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_weight_log_user_date ON weight_log(user_id, DATE(logged_at));

-- Add goal_weight_kg to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goal_weight_kg NUMERIC(10,2);

-- RLS
ALTER TABLE weight_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight log" ON weight_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight log" ON weight_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight log" ON weight_log
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight log" ON weight_log
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger: auto-update profiles.weight_kg when weight_log is inserted
CREATE OR REPLACE FUNCTION update_profile_weight()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET weight_kg = NEW.weight_kg WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_weight_log_insert ON weight_log;
CREATE TRIGGER on_weight_log_insert
  AFTER INSERT ON weight_log
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_weight();