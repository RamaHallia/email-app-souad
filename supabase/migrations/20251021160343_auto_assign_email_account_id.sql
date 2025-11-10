/*
  # Auto-assign email_account_id for tracking tables

  1. Purpose
    - Automatically assigns email_account_id when new rows are inserted
    - Finds the correct email_account_id based on user_id and email address
    - Works for email_traite, email_info, and email_pub tables

  2. Implementation
    - Creates a PostgreSQL function that finds email_account_id
    - Creates triggers on all 3 tracking tables
    - Triggers execute BEFORE INSERT to set email_account_id

  3. Logic
    - If email_account_id is already provided, keeps it
    - If NULL, looks up the configuration using user_id
    - Uses the first (oldest) email configuration for that user

  4. Security
    - Only runs on INSERT operations
    - Maintains data integrity by ensuring valid foreign keys
*/

-- Function to auto-assign email_account_id
CREATE OR REPLACE FUNCTION auto_assign_email_account_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign if email_account_id is NULL
  IF NEW.email_account_id IS NULL THEN
    -- Find the first email configuration for this user
    SELECT id INTO NEW.email_account_id
    FROM email_configurations
    WHERE user_id = NEW.user_id
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- If no configuration found, raise an error
    IF NEW.email_account_id IS NULL THEN
      RAISE EXCEPTION 'No email configuration found for user_id %', NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_auto_assign_email_account_id ON email_traite;
DROP TRIGGER IF EXISTS trigger_auto_assign_email_account_id ON email_info;
DROP TRIGGER IF EXISTS trigger_auto_assign_email_account_id ON email_pub;

-- Create triggers for all tracking tables
CREATE TRIGGER trigger_auto_assign_email_account_id
  BEFORE INSERT ON email_traite
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_email_account_id();

CREATE TRIGGER trigger_auto_assign_email_account_id
  BEFORE INSERT ON email_info
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_email_account_id();

CREATE TRIGGER trigger_auto_assign_email_account_id
  BEFORE INSERT ON email_pub
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_email_account_id();
