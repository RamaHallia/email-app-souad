/*
  # Remove email_accounts table and link tracking tables to email_configurations

  1. Changes
    - Drop foreign key constraints from email_traite, email_info, email_pub
    - Drop the email_accounts table
    - Recreate foreign key constraints pointing to email_configurations
    - Update RLS policies to work with email_configurations

  2. Security
    - Maintain RLS policies on all tracking tables
    - Ensure users can only access their own email tracking data
*/

-- Drop existing foreign key constraints
ALTER TABLE email_traite 
DROP CONSTRAINT IF EXISTS email_traite_email_account_id_fkey;

ALTER TABLE email_info 
DROP CONSTRAINT IF EXISTS email_info_email_account_id_fkey;

ALTER TABLE email_pub 
DROP CONSTRAINT IF EXISTS email_pub_email_account_id_fkey;

-- Drop the email_accounts table
DROP TABLE IF EXISTS email_accounts CASCADE;

-- Recreate foreign key constraints pointing to email_configurations
ALTER TABLE email_traite 
ADD CONSTRAINT email_traite_email_account_id_fkey 
FOREIGN KEY (email_account_id) 
REFERENCES email_configurations(id) 
ON DELETE CASCADE;

ALTER TABLE email_info 
ADD CONSTRAINT email_info_email_account_id_fkey 
FOREIGN KEY (email_account_id) 
REFERENCES email_configurations(id) 
ON DELETE CASCADE;

ALTER TABLE email_pub 
ADD CONSTRAINT email_pub_email_account_id_fkey 
FOREIGN KEY (email_account_id) 
REFERENCES email_configurations(id) 
ON DELETE CASCADE;

-- Update RLS policies for email_traite
DROP POLICY IF EXISTS "Users can view own email_traite" ON email_traite;
DROP POLICY IF EXISTS "Users can insert own email_traite" ON email_traite;
DROP POLICY IF EXISTS "Users can update own email_traite" ON email_traite;
DROP POLICY IF EXISTS "Users can delete own email_traite" ON email_traite;

CREATE POLICY "Users can view own email_traite"
  ON email_traite FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_configurations
      WHERE email_configurations.id = email_traite.email_account_id
      AND email_configurations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own email_traite"
  ON email_traite FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_configurations
      WHERE email_configurations.id = email_traite.email_account_id
      AND email_configurations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own email_traite"
  ON email_traite FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_configurations
      WHERE email_configurations.id = email_traite.email_account_id
      AND email_configurations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_configurations
      WHERE email_configurations.id = email_traite.email_account_id
      AND email_configurations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own email_traite"
  ON email_traite FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_configurations
      WHERE email_configurations.id = email_traite.email_account_id
      AND email_configurations.user_id = auth.uid()
    )
  );

-- Update RLS policies for email_info
DROP POLICY IF EXISTS "Users can view own email_info" ON email_info;
DROP POLICY IF EXISTS "Users can insert own email_info" ON email_info;
DROP POLICY IF EXISTS "Users can update own email_info" ON email_info;
DROP POLICY IF EXISTS "Users can delete own email_info" ON email_info;

CREATE POLICY "Users can view own email_info"
  ON email_info FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_configurations
      WHERE email_configurations.id = email_info.email_account_id
      AND email_configurations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own email_info"
  ON email_info FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_configurations
      WHERE email_configurations.id = email_info.email_account_id
      AND email_configurations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own email_info"
  ON email_info FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_configurations
      WHERE email_configurations.id = email_info.email_account_id
      AND email_configurations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_configurations
      WHERE email_configurations.id = email_info.email_account_id
      AND email_configurations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own email_info"
  ON email_info FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_configurations
      WHERE email_configurations.id = email_info.email_account_id
      AND email_configurations.user_id = auth.uid()
    )
  );

-- Update RLS policies for email_pub
DROP POLICY IF EXISTS "Users can view own email_pub" ON email_pub;
DROP POLICY IF EXISTS "Users can insert own email_pub" ON email_pub;
DROP POLICY IF EXISTS "Users can update own email_pub" ON email_pub;
DROP POLICY IF EXISTS "Users can delete own email_pub" ON email_pub;

CREATE POLICY "Users can view own email_pub"
  ON email_pub FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_configurations
      WHERE email_configurations.id = email_pub.email_account_id
      AND email_configurations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own email_pub"
  ON email_pub FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_configurations
      WHERE email_configurations.id = email_pub.email_account_id
      AND email_configurations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own email_pub"
  ON email_pub FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_configurations
      WHERE email_configurations.id = email_pub.email_account_id
      AND email_configurations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_configurations
      WHERE email_configurations.id = email_pub.email_account_id
      AND email_configurations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own email_pub"
  ON email_pub FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_configurations
      WHERE email_configurations.id = email_pub.email_account_id
      AND email_configurations.user_id = auth.uid()
    )
  );