/*
  # Add onboarding step tracking to profiles

  1. Changes
    - Add `onboarding_step` column to profiles table (integer, default 1)
    - This will track which step the user is on during onboarding (1, 2, or 3)
  
  2. Notes
    - Default value is 1 (first step)
    - When onboarding is completed, is_configured is set to true
    - This allows users to resume onboarding from where they left off
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_step'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_step integer DEFAULT 1;
  END IF;
END $$;