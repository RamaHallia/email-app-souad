/*
  # Add job_title column to profiles table

  1. Changes
    - Add `job_title` column to profiles table (text, nullable, optional field)
  
  2. Notes
    - This field is optional and allows users to specify their job title/function
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'job_title'
  ) THEN
    ALTER TABLE profiles ADD COLUMN job_title text;
  END IF;
END $$;