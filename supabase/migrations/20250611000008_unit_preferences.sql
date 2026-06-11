-- Add unit_preferences JSONB column to profiles
-- Stores user's preferred display units for weight, height, and water
-- Database always stores kg/cm/ml; conversions happen at display time

ALTER TABLE profiles
ADD COLUMN unit_preferences JSONB DEFAULT '{"weight":"kg","height":"cm","water":"ml"}'::jsonb;
