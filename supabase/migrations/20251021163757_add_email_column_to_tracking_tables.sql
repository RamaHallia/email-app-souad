/*
  # Add email column to tracking tables for proper account matching

  1. Purpose
    - Adds email column to email_info, email_pub, and email_traite tables
    - Enables automatic matching of email_account_id based on email address
    - Allows backend to specify which email account without knowing the UUID

  2. Changes
    - Add email column (text) to email_info table
    - Add email column (text) to email_pub table
    - Add email column (text) to email_traite table
    - Update trigger function to match by email when provided

  3. Migration Strategy
    - New column is optional (nullable) for backward compatibility
    - Existing data remains unchanged
    - Future inserts can provide email for automatic matching

  4. Usage
    Backend can now insert with either:
    - email_account_id (direct UUID) - highest priority
    - email (will lookup email_account_id automatically) - second priority
    - neither (will use first user configuration) - fallback
*/

-- Add email column to email_info
ALTER TABLE email_info 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add email column to email_pub
ALTER TABLE email_pub 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add email column to email_traite
ALTER TABLE email_traite 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update the trigger function to match by email when provided
CREATE OR REPLACE FUNCTION auto_assign_email_account_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign if email_account_id is NULL
  IF NEW.email_account_id IS NULL THEN
    
    -- Priority 1: If email is provided, find matching configuration
    IF NEW.email IS NOT NULL THEN
      SELECT id INTO NEW.email_account_id
      FROM email_configurations
      WHERE user_id = NEW.user_id
        AND email = NEW.email
      LIMIT 1;
      
      -- If email provided but no matching configuration found
      IF NEW.email_account_id IS NULL THEN
        RAISE EXCEPTION 'No email configuration found for user_id % with email %', NEW.user_id, NEW.email;
      END IF;
    
    -- Priority 2: No email provided, use first configuration
    ELSE
      SELECT id INTO NEW.email_account_id
      FROM email_configurations
      WHERE user_id = NEW.user_id
      ORDER BY created_at ASC
      LIMIT 1;
      
      -- If no configuration found at all
      IF NEW.email_account_id IS NULL THEN
        RAISE EXCEPTION 'No email configuration found for user_id %', NEW.user_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
