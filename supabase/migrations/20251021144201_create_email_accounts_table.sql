/*
  # Create email_accounts table and update references
  
  1. New Table
    - `email_accounts`
      - `id` (uuid, primary key) - Unique identifier for each email account
      - `user_id` (uuid, foreign key to auth.users) - Owner of the account
      - `email` (text) - Email address
      - `provider` (text) - Provider type (gmail, outlook, smtp_imap)
      - `name` (text) - Friendly name for the account
      - `is_active` (boolean) - Whether the account is active
      - `gmail_token_id` (uuid, foreign key to gmail_tokens) - Reference to Gmail OAuth tokens
      - `outlook_token_id` (uuid, foreign key to outlook_tokens) - Reference to Outlook OAuth tokens
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - Unique constraint on (user_id, email)
  
  2. Changes to existing tables
    - Convert email_account_id from text to uuid in email_traite, email_info, email_pub
    - Add foreign key constraints to email_accounts
  
  3. Security
    - Enable RLS on email_accounts table
    - Add policies for authenticated users to manage their own accounts
*/

-- Create email_accounts table
CREATE TABLE IF NOT EXISTS email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  provider text NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  gmail_token_id uuid REFERENCES gmail_tokens(id) ON DELETE SET NULL,
  outlook_token_id uuid REFERENCES outlook_tokens(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT email_accounts_user_id_email_key UNIQUE (user_id, email)
);

-- Enable RLS on email_accounts
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_accounts
CREATE POLICY "Users can view own email accounts"
  ON email_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email accounts"
  ON email_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email accounts"
  ON email_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email accounts"
  ON email_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop old text columns and recreate as uuid with foreign keys
DO $$
BEGIN
  -- email_traite
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_traite' AND column_name = 'email_account_id' AND data_type = 'text'
  ) THEN
    ALTER TABLE email_traite DROP COLUMN email_account_id;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_traite' AND column_name = 'email_account_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE email_traite ADD COLUMN email_account_id uuid REFERENCES email_accounts(id) ON DELETE CASCADE;
  END IF;

  -- email_info
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_info' AND column_name = 'email_account_id' AND data_type = 'text'
  ) THEN
    ALTER TABLE email_info DROP COLUMN email_account_id;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_info' AND column_name = 'email_account_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE email_info ADD COLUMN email_account_id uuid REFERENCES email_accounts(id) ON DELETE CASCADE;
  END IF;

  -- email_pub
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_pub' AND column_name = 'email_account_id' AND data_type = 'text'
  ) THEN
    ALTER TABLE email_pub DROP COLUMN email_account_id;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_pub' AND column_name = 'email_account_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE email_pub ADD COLUMN email_account_id uuid REFERENCES email_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON email_accounts(email);
CREATE INDEX IF NOT EXISTS idx_email_traite_email_account_id ON email_traite(email_account_id);
CREATE INDEX IF NOT EXISTS idx_email_info_email_account_id ON email_info(email_account_id);
CREATE INDEX IF NOT EXISTS idx_email_pub_email_account_id ON email_pub(email_account_id);
