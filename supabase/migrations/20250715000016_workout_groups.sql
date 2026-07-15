CREATE TABLE workout_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, name)
);

CREATE TABLE workout_group_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES workout_groups(id) ON DELETE CASCADE ON UPDATE CASCADE,
  goal_id UUID NOT NULL REFERENCES workout_goals(id) ON DELETE CASCADE ON UPDATE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(group_id, goal_id)
);

CREATE INDEX idx_workout_groups_user_id ON workout_groups(user_id);
CREATE INDEX idx_workout_group_exercises_group_id ON workout_group_exercises(group_id);
CREATE INDEX idx_workout_group_exercises_goal_id ON workout_group_exercises(goal_id);

ALTER TABLE workout_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_group_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout groups"
  ON workout_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workout groups"
  ON workout_groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workout groups"
  ON workout_groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workout groups"
  ON workout_groups FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own workout group exercises"
  ON workout_group_exercises FOR SELECT USING (
    EXISTS (SELECT 1 FROM workout_groups WHERE id = group_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can create their own workout group exercises"
  ON workout_group_exercises FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM workout_groups WHERE id = group_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can update their own workout group exercises"
  ON workout_group_exercises FOR UPDATE USING (
    EXISTS (SELECT 1 FROM workout_groups WHERE id = group_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can delete their own workout group exercises"
  ON workout_group_exercises FOR DELETE USING (
    EXISTS (SELECT 1 FROM workout_groups WHERE id = group_id AND user_id = auth.uid())
  );
