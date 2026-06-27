-- Add icon_name column to workout_goals for custom icon selection
ALTER TABLE workout_goals ADD COLUMN IF NOT EXISTS icon_name TEXT;

-- Backfill default exercises with their matching icon names
UPDATE workout_goals SET icon_name = 'weightlifting' WHERE exercise_type = 'pushups' AND icon_name IS NULL;
UPDATE workout_goals SET icon_name = 'abs' WHERE exercise_type = 'crunches' AND icon_name IS NULL;
UPDATE workout_goals SET icon_name = 'abs' WHERE exercise_type = 'situps' AND icon_name IS NULL;
UPDATE workout_goals SET icon_name = 'squats' WHERE exercise_type = 'squats' AND icon_name IS NULL;
