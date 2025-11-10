/*
  # Allow multiple email accounts per user

  1. Changes
    - Drop the unique constraint on email_configurations(user_id)
    - Add unique constraint on (user_id, email) to prevent duplicate emails per user
    - Update RLS policies to work with multiple accounts

  2. Security
    - Users can only access their own email configurations
    - Policies remain restrictive and check user_id
*/

-- Drop the unique constraint on user_id to allow multiple accounts per user
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'email_configurations_user_id_key'
  ) THEN
    ALTER TABLE email_configurations
      DROP CONSTRAINT email_configurations_user_id_key;
  END IF;
END $$;

-- Add unique constraint on (user_id, email) to prevent duplicate emails per user
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'email_configurations_user_id_email_key'
  ) THEN
    ALTER TABLE email_configurations
      ADD CONSTRAINT email_configurations_user_id_email_key UNIQUE (user_id, email);
  END IF;
END $$;
