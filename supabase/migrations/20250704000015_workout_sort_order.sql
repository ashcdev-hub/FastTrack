-- Migration: Add sort_order to workout_goals for exercise reordering
ALTER TABLE workout_goals ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Seed sort_order for existing rows based on current alphabetical order per user
UPDATE workout_goals SET sort_order = subq.row_number FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY exercise_type) - 1 AS row_number
  FROM workout_goals
) AS subq WHERE workout_goals.id = subq.id;
