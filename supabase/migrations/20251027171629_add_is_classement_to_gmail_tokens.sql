/*
  # Add is_classement column to gmail_tokens table

  1. Changes
    - Add `is_classement` column to `gmail_tokens` table with default value true
    - This column controls whether automatic email classification is enabled for Gmail accounts

  2. Notes
    - Default value is true to maintain current behavior
    - This column will be synchronized with email_configurations.is_classement
*/

-- Add is_classement column to gmail_tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gmail_tokens' AND column_name = 'is_classement'
  ) THEN
    ALTER TABLE gmail_tokens ADD COLUMN is_classement boolean DEFAULT true NOT NULL;
  END IF;
END $$;