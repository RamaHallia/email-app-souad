/*
  # Update triggers to auto-populate email column

  1. Purpose
    - Automatically populates the email column from email_configurations table
    - Updates the existing auto_assign_email_account_id function
    - Fetches email address when assigning email_account_id

  2. Changes
    - Modifies the trigger function to also set NEW.email
    - Retrieves email from email_configurations table
    - Works for email_traite, email_info, and email_pub tables

  3. Logic
    - When email_account_id is NULL, finds the configuration
    - Also retrieves and assigns the email address from that configuration
    - Maintains backward compatibility

  4. Security
    - Only runs on INSERT operations
    - Ensures data consistency across tables
*/

-- Updated function to auto-assign both email_account_id and email
CREATE OR REPLACE FUNCTION auto_assign_email_account_id()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Only assign if email_account_id is NULL
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
    -- If email_account_id is provided but email is NULL, fetch the email
    IF NEW.email IS NULL THEN
      SELECT email INTO v_email
      FROM email_configurations
      WHERE id = NEW.email_account_id;
      
      IF v_email IS NOT NULL THEN
        NEW.email := v_email;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
