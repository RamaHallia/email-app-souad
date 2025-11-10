/*
  # Create Email Tracking Tables

  1. New Tables
    - `email_traite`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `email_id` (uuid, optional foreign key to emails table)
      - `sender_email` (text)
      - `subject` (text)
      - `body` (text)
      - `received_at` (timestamptz)
      - `processed_at` (timestamptz)
      - `status` (text) - processing status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `email_info`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `email_traite_id` (uuid, foreign key to email_traite)
      - `sender_email` (text)
      - `sender_name` (text)
      - `company_info` (jsonb) - extracted company information
      - `contact_info` (jsonb) - extracted contact details
      - `classification` (text) - email classification
      - `confidence_score` (decimal) - AI confidence score
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `email_pub`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `email_traite_id` (uuid, foreign key to email_traite)
      - `is_promotional` (boolean)
      - `is_spam` (boolean)
      - `category` (text)
      - `keywords` (text array)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create email_traite table
CREATE TABLE IF NOT EXISTS email_traite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id uuid REFERENCES emails(id) ON DELETE SET NULL,
  sender_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  received_at timestamptz DEFAULT now(),
  processed_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_info table
CREATE TABLE IF NOT EXISTS email_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_traite_id uuid REFERENCES email_traite(id) ON DELETE CASCADE,
  sender_email text NOT NULL,
  sender_name text,
  company_info jsonb DEFAULT '{}',
  contact_info jsonb DEFAULT '{}',
  classification text,
  confidence_score decimal(5,2) DEFAULT 0.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_pub table
CREATE TABLE IF NOT EXISTS email_pub (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_traite_id uuid REFERENCES email_traite(id) ON DELETE CASCADE,
  is_promotional boolean DEFAULT false,
  is_spam boolean DEFAULT false,
  category text,
  keywords text[],
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_traite ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_pub ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_traite
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

-- RLS Policies for email_info
CREATE POLICY "Users can view own email info"
  ON email_info FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email info"
  ON email_info FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email info"
  ON email_info FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email info"
  ON email_info FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for email_pub
CREATE POLICY "Users can view own email pub data"
  ON email_pub FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email pub data"
  ON email_pub FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email pub data"
  ON email_pub FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email pub data"
  ON email_pub FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_traite_user_id ON email_traite(user_id);
CREATE INDEX IF NOT EXISTS idx_email_traite_email_id ON email_traite(email_id);
CREATE INDEX IF NOT EXISTS idx_email_traite_status ON email_traite(status);
CREATE INDEX IF NOT EXISTS idx_email_info_user_id ON email_info(user_id);
CREATE INDEX IF NOT EXISTS idx_email_info_email_traite_id ON email_info(email_traite_id);
CREATE INDEX IF NOT EXISTS idx_email_pub_user_id ON email_pub(user_id);
CREATE INDEX IF NOT EXISTS idx_email_pub_email_traite_id ON email_pub(email_traite_id);