-- Migration: Add profile settings columns
-- Adds gender, age, height, BMI, and notification preferences to profiles table

-- Add new columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age > 0 AND age < 150),
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(10,2) CHECK (height_cm > 0 AND height_cm < 300),
  ADD COLUMN IF NOT EXISTS bmi NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"fasting_reminders": true, "eating_reminders": true, "daily_digest": true}'::jsonb;

-- Create function to auto-calculate BMI when weight or height changes
CREATE OR REPLACE FUNCTION calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.weight_kg IS NOT NULL AND NEW.height_cm IS NOT NULL AND NEW.height_cm > 0 THEN
    NEW.bmi := ROUND(NEW.weight_kg / POWER(NEW.height_cm / 100.0, 2), 1);
  ELSE
    NEW.bmi := NULL;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-calculate BMI on insert/update
DROP TRIGGER IF EXISTS calculate_bmi_trigger ON profiles;
CREATE TRIGGER calculate_bmi_trigger
  BEFORE INSERT OR UPDATE OF weight_kg, height_cm ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_bmi();

-- Backfill BMI for existing profiles with weight and height
UPDATE profiles
SET bmi = ROUND(weight_kg / POWER(height_cm / 100.0, 2), 1)
WHERE weight_kg IS NOT NULL AND height_cm IS NOT NULL AND height_cm > 0;
