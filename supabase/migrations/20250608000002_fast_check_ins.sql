-- Fast check-ins: notes and mood during fasting/eating windows
CREATE TABLE IF NOT EXISTS fast_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  session_id UUID NOT NULL REFERENCES fasting_sessions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  note TEXT,
  phase TEXT CHECK (phase IN ('fasting', 'eating')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fast_check_ins_session_id ON fast_check_ins(session_id);
CREATE INDEX IF NOT EXISTS idx_fast_check_ins_user_id ON fast_check_ins(user_id);

-- RLS
ALTER TABLE fast_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own check-ins" ON fast_check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins" ON fast_check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own check-ins" ON fast_check_ins
  FOR DELETE USING (auth.uid() = user_id);
