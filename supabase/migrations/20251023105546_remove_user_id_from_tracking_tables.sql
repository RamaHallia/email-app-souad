/*
  # Remove user_id column from tracking tables

  1. Changes
    - Drop RLS policies that depend on `user_id` column
    - Remove `user_id` column from `email_info` table
    - Remove `user_id` column from `email_pub` table
    - Remove `user_id` column from `email_traite` table
    - Recreate RLS policies based on `email` column instead
  
  2. Security
    - Users can only access records matching their email addresses
    - Policies check email ownership through email_configurations table
  
  3. Notes
    - These tables will now rely solely on the `email` column for user identification
    - The `email_account_id` column remains for linking to email_configurations
*/

-- Drop existing policies for email_info
DROP POLICY IF EXISTS "Users can view own email info" ON email_info;
DROP POLICY IF EXISTS "Users can insert own email info" ON email_info;
DROP POLICY IF EXISTS "Users can update own email info" ON email_info;
DROP POLICY IF EXISTS "Users can delete own email info" ON email_info;

-- Drop existing policies for email_pub
DROP POLICY IF EXISTS "Users can view own email pub" ON email_pub;
DROP POLICY IF EXISTS "Users can insert own email pub" ON email_pub;
DROP POLICY IF EXISTS "Users can update own email pub" ON email_pub;
DROP POLICY IF EXISTS "Users can delete own email pub" ON email_pub;

-- Drop existing policies for email_traite
DROP POLICY IF EXISTS "Users can view own email traite" ON email_traite;
DROP POLICY IF EXISTS "Users can insert own email traite" ON email_traite;
DROP POLICY IF EXISTS "Users can update own email traite" ON email_traite;
DROP POLICY IF EXISTS "Users can delete own email traite" ON email_traite;

-- Remove user_id columns
ALTER TABLE email_info DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE email_pub DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE email_traite DROP COLUMN IF EXISTS user_id CASCADE;

-- Recreate RLS policies based on email column

-- email_info policies
CREATE POLICY "Users can view own email info"
  ON email_info FOR SELECT
  TO authenticated
  USING (
    email IN (
      SELECT email FROM email_configurations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own email info"
  ON email_info FOR INSERT
  TO authenticated
  WITH CHECK (
    email IN (
      SELECT email FROM email_configurations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own email info"
  ON email_info FOR UPDATE
  TO authenticated
  USING (
    email IN (
      SELECT email FROM email_configurations
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    email IN (
      SELECT email FROM email_configurations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own email info"
  ON email_info FOR DELETE
  TO authenticated
  USING (
    email IN (
      SELECT email FROM email_configurations
      WHERE user_id = auth.uid()
    )
  );

-- email_pub policies
CREATE POLICY "Users can view own email pub"
  ON email_pub FOR SELECT
  TO authenticated
  USING (
    email IN (
      SELECT email FROM email_configurations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own email pub"
  ON email_pub FOR INSERT
  TO authenticated
  WITH CHECK (
    email IN (
      SELECT email FROM email_configurations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own email pub"
  ON email_pub FOR UPDATE
  TO authenticated
  USING (
    email IN (
      SELECT email FROM email_configurations
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    email IN (
      SELECT email FROM email_configurations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own email pub"
  ON email_pub FOR DELETE
  TO authenticated
  USING (
    email IN (
      SELECT email FROM email_configurations
      WHERE user_id = auth.uid()
    )
  );

-- email_traite policies
CREATE POLICY "Users can view own email traite"
  ON email_traite FOR SELECT
  TO authenticated
  USING (
    email IN (
      SELECT email FROM email_configurations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own email traite"
  ON email_traite FOR INSERT
  TO authenticated
  WITH CHECK (
    email IN (
      SELECT email FROM email_configurations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own email traite"
  ON email_traite FOR UPDATE
  TO authenticated
  USING (
    email IN (
      SELECT email FROM email_configurations
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    email IN (
      SELECT email FROM email_configurations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own email traite"
  ON email_traite FOR DELETE
  TO authenticated
  USING (
    email IN (
      SELECT email FROM email_configurations
      WHERE user_id = auth.uid()
    )
  );