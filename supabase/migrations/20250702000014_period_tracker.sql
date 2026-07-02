CREATE TABLE IF NOT EXISTS period_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  log_date DATE NOT NULL,
  flow_intensity TEXT CHECK (flow_intensity IN ('spotting','light','medium','heavy')),
  cramps TEXT CHECK (cramps IN ('none','mild','moderate','severe')),
  mood TEXT CHECK (mood IN ('happy','neutral','irritable','sad','anxious','energetic','fatigued')),
  energy TEXT CHECK (energy IN ('high','normal','low')),
  headache BOOLEAN DEFAULT false,
  bloating BOOLEAN DEFAULT false,
  cravings BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

ALTER TABLE period_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY period_log_policy ON period_log
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS period_settings JSONB DEFAULT '{
  "cycle_length": 28,
  "period_duration": 5,
  "luteal_phase_length": 14
}'::jsonb;
