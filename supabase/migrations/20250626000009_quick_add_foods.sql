-- Add quick_add_foods column to profiles
-- Stores user's preferred quick-add food names as a JSONB array
-- e.g. ["Boiled Egg", "Chicken Breast (cooked)", "Banana", "Coffee"]

ALTER TABLE profiles
ADD COLUMN quick_add_foods JSONB DEFAULT '["Boiled Egg", "Chicken Breast (cooked)", "White Rice (cooked)", "Banana", "Greek Yogurt", "Oatmeal (cooked)", "Coffee", "Apple"]'::jsonb;
