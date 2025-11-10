/*
  # Add CASCADE DELETE to email configuration tokens

  ## Changes
  1. Drop existing foreign key constraints on email_configurations
  2. Re-add them with ON DELETE CASCADE
  
  ## Security
  - No changes to RLS policies
  
  ## Notes
  When an email_configuration is deleted, associated gmail_token or outlook_token 
  will be automatically deleted as well.
*/

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'email_configurations_gmail_token_id_fkey'
  ) THEN
    ALTER TABLE email_configurations 
    DROP CONSTRAINT email_configurations_gmail_token_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'email_configurations_outlook_token_id_fkey'
  ) THEN
    ALTER TABLE email_configurations 
    DROP CONSTRAINT email_configurations_outlook_token_id_fkey;
  END IF;
END $$;

ALTER TABLE email_configurations
ADD CONSTRAINT email_configurations_gmail_token_id_fkey
FOREIGN KEY (gmail_token_id)
REFERENCES gmail_tokens(id)
ON DELETE CASCADE;

ALTER TABLE email_configurations
ADD CONSTRAINT email_configurations_outlook_token_id_fkey
FOREIGN KEY (outlook_token_id)
REFERENCES outlook_tokens(id)
ON DELETE CASCADE;