/*
  # Fix trigger to use correct email based on email_account_id

  1. Purpose
    - Fixes the trigger to always fetch email from the provided email_account_id
    - Removes the logic that selects the first/oldest email configuration
    - Ensures email column matches the email_account_id being used

  2. Changes
    - Trigger now requires email_account_id to be provided
    - Fetches the correct email from email_configurations using the provided email_account_id
    - No longer defaults to the first email configuration

  3. Logic
    - If email_account_id is provided, fetch its corresponding email
    - If email_account_id is NULL, raise an error (it must be provided)
    - Always ensures email matches the email_account_id

  4. Security
    - Maintains data integrity by ensuring email matches email_account_id
    - Prevents mismatched data
*/

-- Updated function to fetch email based on the provided email_account_id
CREATE OR REPLACE FUNCTION auto_assign_email_account_id()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- email_account_id must be provided
  IF NEW.email_account_id IS NULL THEN
    RAISE EXCEPTION 'email_account_id must be provided for user_id %', NEW.user_id;
  END IF;
  
  -- Fetch the email from email_configurations using the provided email_account_id
  SELECT email INTO v_email
  FROM email_configurations
  WHERE id = NEW.email_account_id
  AND user_id = NEW.user_id;
  
  -- If no matching configuration found, raise an error
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'No email configuration found for email_account_id % and user_id %', NEW.email_account_id, NEW.user_id;
  END IF;
  
  -- Set the email column
  NEW.email := v_email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
