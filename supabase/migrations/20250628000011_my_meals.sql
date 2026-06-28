CREATE TABLE IF NOT EXISTS my_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  serving_size TEXT,
  calories NUMERIC(10,2) NOT NULL,
  protein_g NUMERIC(10,2),
  carbs_g NUMERIC(10,2),
  fat_g NUMERIC(10,2),
  description TEXT,
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_my_meals_user_id ON my_meals(user_id);
CREATE INDEX IF NOT EXISTS idx_my_meals_last_used ON my_meals(user_id, last_used_at DESC NULLS LAST);

ALTER TABLE my_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own my_meals" ON my_meals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own my_meals" ON my_meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own my_meals" ON my_meals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own my_meals" ON my_meals
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_my_meals_updated_at
  BEFORE UPDATE ON my_meals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
