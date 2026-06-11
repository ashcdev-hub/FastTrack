-- Add fasting schedule to fasting_sessions
ALTER TABLE fasting_sessions
  ADD COLUMN IF NOT EXISTS fasting_schedule TEXT;

COMMENT ON COLUMN fasting_sessions.fasting_schedule IS 'e.g. 16:8, 20:4, 14:10, or custom like 17:7';
