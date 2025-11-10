/*
  # Add is_classement column to email_configurations

  1. Changes
    - Add `is_classement` boolean column to `email_configurations` table
    - Default value is `false`
    - Column is NOT NULL

  2. Notes
    - Existing rows will automatically get the default value of `false`
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_configurations' AND column_name = 'is_classement'
  ) THEN
    ALTER TABLE email_configurations ADD COLUMN is_classement boolean NOT NULL DEFAULT false;
  END IF;
END $$;