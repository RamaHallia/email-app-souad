/*
  # Create Email Tracking Tables

  1. New Tables
    - `email_traite` - Tracks processed/handled emails
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, foreign key) - References auth.users
      - `traite` (text) - Email content/identifier that was processed
      - `created_at` (timestamptz) - Timestamp when email was processed
    
    - `email_info` - Tracks informational emails
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, foreign key) - References auth.users
      - `info` (text) - Email content/identifier for informational emails
      - `created_at` (timestamptz) - Timestamp when email was categorized
    
    - `email_pub` - Tracks advertisement/promotional emails
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, foreign key) - References auth.users
      - `pub` (text) - Email content/identifier for advertisements
      - `created_at` (timestamptz) - Timestamp when email was filtered

  2. Security
    - Enable RLS on all three tables
    - Add policies for authenticated users to:
      - Read only their own email tracking data
      - Insert their own email tracking data
      - Update their own email tracking data
      - Delete their own email tracking data
*/

-- Create email_traite table
CREATE TABLE IF NOT EXISTS email_traite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  traite text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create email_info table
CREATE TABLE IF NOT EXISTS email_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  info text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create email_pub table
CREATE TABLE IF NOT EXISTS email_pub (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pub text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_traite_user_id ON email_traite(user_id);
CREATE INDEX IF NOT EXISTS idx_email_traite_created_at ON email_traite(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_info_user_id ON email_info(user_id);
CREATE INDEX IF NOT EXISTS idx_email_info_created_at ON email_info(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_pub_user_id ON email_pub(user_id);
CREATE INDEX IF NOT EXISTS idx_email_pub_created_at ON email_pub(created_at DESC);

-- Enable RLS on email_traite
ALTER TABLE email_traite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own processed emails"
  ON email_traite FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own processed emails"
  ON email_traite FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own processed emails"
  ON email_traite FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own processed emails"
  ON email_traite FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable RLS on email_info
ALTER TABLE email_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own info emails"
  ON email_info FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own info emails"
  ON email_info FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own info emails"
  ON email_info FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own info emails"
  ON email_info FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable RLS on email_pub
ALTER TABLE email_pub ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pub emails"
  ON email_pub FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pub emails"
  ON email_pub FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pub emails"
  ON email_pub FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pub emails"
  ON email_pub FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
