ALTER TABLE profiles
ADD COLUMN enabled_trackers JSONB NOT NULL DEFAULT '{
  "fasting": true,
  "workouts": true,
  "food": true,
  "hydration": true,
  "weight": true,
  "period": false
}'::jsonb;
