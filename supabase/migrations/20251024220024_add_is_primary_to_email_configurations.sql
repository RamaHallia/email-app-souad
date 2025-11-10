/*
  # Add is_primary column to email_configurations

  1. Changes
    - Add `is_primary` boolean column to email_configurations table
    - Default to false for new entries
    - Set the first account for each user as primary
    - Add constraint to ensure only one primary account per user

  2. Logic
    - When first account is created, it becomes primary automatically
    - When primary account is deleted, the next account becomes primary
    - Only one account can be primary per user at a time
*/

-- Add is_primary column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_configurations' AND column_name = 'is_primary'
  ) THEN
    ALTER TABLE email_configurations ADD COLUMN is_primary boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Set the first account for each user as primary (based on created_at)
WITH first_accounts AS (
  SELECT DISTINCT ON (user_id) id
  FROM email_configurations
  ORDER BY user_id, created_at ASC
)
UPDATE email_configurations
SET is_primary = true
WHERE id IN (SELECT id FROM first_accounts);

-- Create function to ensure only one primary account per user
CREATE OR REPLACE FUNCTION ensure_one_primary_account()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this account as primary, unset all other accounts for this user
  IF NEW.is_primary = true THEN
    UPDATE email_configurations
    SET is_primary = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;

  -- If this is the user's first account, make it primary
  IF NOT EXISTS (
    SELECT 1 FROM email_configurations
    WHERE user_id = NEW.user_id AND id != NEW.id
  ) THEN
    NEW.is_primary := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for insert/update
DROP TRIGGER IF EXISTS ensure_one_primary_on_insert_update ON email_configurations;
CREATE TRIGGER ensure_one_primary_on_insert_update
  BEFORE INSERT OR UPDATE ON email_configurations
  FOR EACH ROW
  EXECUTE FUNCTION ensure_one_primary_account();

-- Create function to promote next account when primary is deleted
CREATE OR REPLACE FUNCTION promote_next_account_on_primary_delete()
RETURNS TRIGGER AS $$
DECLARE
  next_account_id uuid;
BEGIN
  -- If deleting a primary account, promote the next one
  IF OLD.is_primary = true THEN
    SELECT id INTO next_account_id
    FROM email_configurations
    WHERE user_id = OLD.user_id
      AND id != OLD.id
    ORDER BY created_at ASC
    LIMIT 1;

    IF next_account_id IS NOT NULL THEN
      UPDATE email_configurations
      SET is_primary = true
      WHERE id = next_account_id;
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for delete
DROP TRIGGER IF EXISTS promote_on_primary_delete ON email_configurations;
CREATE TRIGGER promote_on_primary_delete
  BEFORE DELETE ON email_configurations
  FOR EACH ROW
  EXECUTE FUNCTION promote_next_account_on_primary_delete();
