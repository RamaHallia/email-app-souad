/*
  # Fix cascade delete for email accounts and tokens
  
  1. Changes
    - Drop existing foreign keys on email_accounts (gmail_token_id, outlook_token_id)
    - Recreate them with ON DELETE CASCADE instead of SET NULL
    - When a token is deleted, the email_account entry will also be deleted
    - When an email_account is deleted, associated tracking data is deleted (already in place)
  
  2. Behavior
    - Deleting gmail_tokens row → deletes email_accounts row → deletes all tracking data
    - Deleting outlook_tokens row → deletes email_accounts row → deletes all tracking data
    - Deleting email_accounts row → deletes all tracking data (email_traite, email_info, email_pub)
*/

-- Drop existing foreign keys
DO $$ 
BEGIN
  -- Drop gmail_token_id foreign key
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'email_accounts_gmail_token_id_fkey'
  ) THEN
    ALTER TABLE email_accounts DROP CONSTRAINT email_accounts_gmail_token_id_fkey;
  END IF;

  -- Drop outlook_token_id foreign key
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'email_accounts_outlook_token_id_fkey'
  ) THEN
    ALTER TABLE email_accounts DROP CONSTRAINT email_accounts_outlook_token_id_fkey;
  END IF;
END $$;

-- Recreate foreign keys with CASCADE
ALTER TABLE email_accounts
  ADD CONSTRAINT email_accounts_gmail_token_id_fkey
  FOREIGN KEY (gmail_token_id) REFERENCES gmail_tokens(id) ON DELETE CASCADE;

ALTER TABLE email_accounts
  ADD CONSTRAINT email_accounts_outlook_token_id_fkey
  FOREIGN KEY (outlook_token_id) REFERENCES outlook_tokens(id) ON DELETE CASCADE;
