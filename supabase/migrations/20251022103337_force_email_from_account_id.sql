/*
  # Force email column to match email_account_id
  
  1. Purpose
    - Always populate the email column from email_configurations
    - Override any value sent by external systems (like n8n)
    - Ensure data consistency between email_account_id and email columns
  
  2. Changes
    - Modifies the trigger function to ALWAYS set email from email_configurations
    - Removes the check for NULL email before assigning
    - Ensures email always matches the email_account_id reference
  
  3. Logic
    - When email_account_id is NULL: finds first config and assigns both id and email
    - When email_account_id is provided: ALWAYS fetches and sets the corresponding email
    - Guarantees email column accuracy regardless of input data
  
  4. Security
    - Only runs on INSERT operations
    - Ensures referential integrity between tables
*/

-- Updated function to ALWAYS assign email from email_account_id
CREATE OR REPLACE FUNCTION auto_assign_email_account_id()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Only assign email_account_id if it's NULL
  IF NEW.email_account_id IS NULL THEN
    -- Find the first email configuration for this user and get the email
    SELECT id, email INTO NEW.email_account_id, v_email
    FROM email_configurations
    WHERE user_id = NEW.user_id
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- If no configuration found, raise an error
    IF NEW.email_account_id IS NULL THEN
      RAISE EXCEPTION 'No email configuration found for user_id %', NEW.user_id;
    END IF;
    
    -- Set the email column
    NEW.email := v_email;
  ELSE
    -- If email_account_id is provided, ALWAYS fetch and set the email
    -- This ensures consistency even if external systems send wrong email values
    SELECT email INTO v_email
    FROM email_configurations
    WHERE id = NEW.email_account_id;
    
    IF v_email IS NOT NULL THEN
      NEW.email := v_email;
    ELSE
      RAISE EXCEPTION 'Invalid email_account_id: no configuration found with id %', NEW.email_account_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;