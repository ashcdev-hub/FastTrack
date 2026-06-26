-- Add onboarding_completed column to profiles
-- Allows tracking onboarding state server-side so users don't see onboarding
-- again when logging in from a new device or after reinstalling

ALTER TABLE profiles
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;

-- Mark all existing users with a display_name as onboarded
UPDATE profiles SET onboarding_completed = TRUE WHERE display_name IS NOT NULL;
